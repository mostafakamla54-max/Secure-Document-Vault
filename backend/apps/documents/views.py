import codecs
import hashlib

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, mixins, permissions, status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.models import AuditLog

from .models import Document, DocumentTag, DocumentVersion
from .serializers import (
    DocumentSerializer,
    DocumentTagSerializer,
    DocumentUploadSerializer,
    DocumentVersionSerializer,
)

TUNABLE_DOWNLOAD_MIME = {
    'application/pdf': 'application/pdf',
    'image/png': 'image/png',
    'image/jpeg': 'image/jpeg',
}


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    filterset_fields = ['category', 'importance', 'is_archived', 'is_favorite']
    search_fields = ['title', 'description']

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user, is_deleted=False)

    def get_serializer_class(self):
        if self.action == 'create':
            return DocumentUploadSerializer
        return DocumentSerializer

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        AuditLog.objects.log(
            actor=self.request.user,
            action='DOCUMENT_CREATE',
            object_type='document',
            object_id=instance.id,
            detail=f'Created document "{instance.title}"',
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        AuditLog.objects.log(
            actor=self.request.user,
            action='DOCUMENT_UPDATE',
            object_type='document',
            object_id=instance.id,
            detail=f'Updated document "{instance.title}"',
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.soft_delete()
        AuditLog.objects.log(
            actor=request.user,
            action='DOCUMENT_DELETE',
            object_type='document',
            object_id=instance.id,
            detail=f'Soft-deleted document "{instance.title}"',
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.mark_accessed()
        instance.refresh_from_db()
        AuditLog.objects.log(
            actor=request.user,
            action='DOCUMENT_VIEW',
            object_type='document',
            object_id=instance.id,
            detail=f'Viewed document "{instance.title}"',
        )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class DocumentDownloadView(APIView):
    """Download the decrypted document content (audited and counted)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        doc = get_object_or_404(
            Document, pk=pk, user=request.user, is_deleted=False
        )
        content = doc.decrypt_content()
        if not content:
            return Response(
                {'detail': 'Document has no content.'}, status=status.HTTP_404_NOT_FOUND
            )
        Document.objects.filter(pk=doc.pk).update(download_count=doc.download_count + 1)
        AuditLog.objects.log(
            actor=request.user,
            action='DOCUMENT_DOWNLOAD',
            object_type='document',
            object_id=doc.id,
            detail=f'Downloaded document "{doc.title}"',
        )
        from django.http import HttpResponse
        response = HttpResponse(content, content_type=doc.mime_type or 'application/octet-stream')
        response['Content-Disposition'] = f'attachment; filename="{doc.original_filename}"'
        return response


class TrashView(APIView):
    """List, restore, or permanently delete soft-deleted documents."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        docs = Document.objects.filter(user=request.user, is_deleted=True).order_by('-deleted_at')
        return Response(DocumentSerializer(docs, many=True).data)

    def post(self, request, pk):
        doc = get_object_or_404(Document, pk=pk, user=request.user, is_deleted=True)
        doc.restore()
        AuditLog.objects.log(
            actor=request.user, action='DOCUMENT_RESTORE',
            object_type='document', object_id=doc.id,
            detail=f'Restored document "{doc.title}"',
        )
        return Response({'detail': 'Document restored.'})

    def delete(self, request, pk):
        doc = get_object_or_404(Document, pk=pk, user=request.user, is_deleted=True)
        AuditLog.objects.log(
            actor=request.user, action='DOCUMENT_PURGE',
            object_type='document', object_id=doc.id,
            detail=f'Permanently deleted "{doc.title}"',
        )
        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ToggleFavoriteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        doc = get_object_or_404(Document, pk=pk, user=request.user, is_deleted=False)
        doc.is_favorite = not doc.is_favorite
        doc.save(update_fields=['is_favorite'])
        return Response({'is_favorite': doc.is_favorite})


class ToggleArchiveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        doc = get_object_or_404(Document, pk=pk, user=request.user, is_deleted=False)
        doc.is_archived = not doc.is_archived
        doc.save(update_fields=['is_archived'])
        return Response({'is_archived': doc.is_archived})


class DocumentVersionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = DocumentVersionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DocumentVersion.objects.filter(
            document__user=self.request.user, document__is_deleted=False
        )

    def list(self, request, *args, **kwargs):
        doc = get_object_or_404(
            Document, pk=self.kwargs['document_pk'], user=request.user, is_deleted=False
        )
        versions = DocumentVersion.objects.filter(document=doc)
        return Response(self.get_serializer(versions, many=True).data)


class DocumentTagViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentTagSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DocumentTag.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DocumentAiAnalyzeView(APIView):
    """AI analysis of a document's decrypted content (audited)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        doc = get_object_or_404(
            Document, pk=pk, user=request.user, is_deleted=False
        )
        from .ai_service import analyze_document
        raw = doc.decrypt_content() or b''
        if isinstance(raw, bytes):
            raw = raw.decode('utf-8', errors='ignore')
        result = analyze_document(
            text=raw,
            title=doc.title,
            category=doc.category or '',
        )
        AuditLog.objects.log(
            actor=request.user, action='DOCUMENT_AI_ANALYZE',
            object_type='document', object_id=doc.id,
            detail='AI analyzed "{0}" via provider={1}'.format(doc.title, result.get('provider')),
        )
        return Response(result)


def _hex_bytes(data):
    return codecs.encode(data, 'hex').decode('ascii')


class DocumentEncryptedTextView(APIView):
    """Return encrypted metadata + hex dump of the ciphertext (owner only).

    Safe by design: the ciphertext alone is useless without the key, so it can
    be shown to the owner to prove the AES-256-GCM encryption is real.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        doc = get_object_or_404(
            Document, pk=pk, user=request.user, is_deleted=False
        )
        if not doc.encrypted_file:
            return Response(
                {'detail': 'Document has no encrypted content.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        AuditLog.objects.log(
            actor=request.user, action='DOCUMENT_VIEW_ENCRYPTED',
            object_type='document', object_id=doc.id,
            detail=f'Viewing encrypted content of "{doc.title}"',
        )
        encrypted = bytes(doc.encrypted_file)
        is_link = doc.original_extension == 'link'
        return Response({
            'id': doc.id,
            'title': doc.title,
            'created_at': doc.created_at.isoformat() if doc.created_at else None,
            'category': doc.category or '',
            'importance': doc.importance or '',
            'is_link': is_link,
            'content_type': 'link' if is_link else (doc.mime_type or 'file'),
            'filename': doc.original_filename or '',
            'algorithm': 'AES-256-GCM',
            'key_bits': 256,
            'nonce_bytes': len(doc.nonce or b''),
            'tag_bytes': 16,
            'ciphertext_bytes': len(encrypted),
            'plaintext_bytes': doc.file_size or 0,
            'nonce_hex': _hex_bytes(doc.nonce or b''),
            'ciphertext_hex': _hex_bytes(encrypted),
            'checksum_sha256': doc.checksum or '',
        })


class DocumentDecryptTextView(APIView):
    """Decrypt on the server and return the original content (owner only).

    The key never leaves the server; only the owner may trigger decryption,
    and every decrypt is written to the audit log.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        doc = get_object_or_404(
            Document, pk=pk, user=request.user, is_deleted=False
        )
        raw = doc.decrypt_content() or b''
        if not raw:
            return Response(
                {'detail': 'Document has no content.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        text = None
        try:
            text = raw.decode('utf-8')
        except (UnicodeDecodeError, AttributeError):
            text = None
        checksum_match = bool(doc.checksum) and (
            hashlib.sha256(raw).hexdigest() == doc.checksum
        )
        AuditLog.objects.log(
            actor=request.user, action='DOCUMENT_DECRYPT',
            object_type='document', object_id=doc.id,
            detail=f'Decrypted document "{doc.title}" ({len(raw)} bytes)',
        )
        return Response({
            'decrypted': text,
            'is_text': text is not None,
            'bytes': len(raw),
            'checksum_match': checksum_match,
            'filename': doc.original_filename or '',
            'mime_type': doc.mime_type or 'application/octet-stream',
        })
