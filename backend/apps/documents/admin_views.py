from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.audit.models import AuditLog
from middleware.rate_limit import rate_limit

from .models import Document


def _to_bool(value):
    if isinstance(value, bool):
        return value
    return str(value).lower() in ('1', 'true', 'yes', 'on')


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.is_superuser or request.user.is_staff)
        )


class AdminStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        total_users = User.objects.count()
        total_docs = Document.objects.count()
        active_docs = Document.objects.filter(is_deleted=False).count()
        stats = Document.objects.aggregate(v=Count('view_count'), d=Count('download_count'))
        return Response({
            'total_users': total_users,
            'total_docs': total_docs,
            'active_docs': active_docs,
            'total_views': stats['v'] or 0,
            'total_downloads': stats['d'] or 0,
            'audit_logs': AuditLog.objects.count(),
        })


class AdminUsersView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        users = User.objects.all().order_by('-date_joined')[:200]
        data = [{
            'id': u.id, 'username': u.username, 'email': u.email,
            'is_active': u.is_active, 'is_staff': u.is_staff,
            'is_superuser': u.is_superuser, 'date_joined': u.date_joined,
            'docs': u.documents.count(),
        } for u in users]
        return Response(data)

    def patch(self, request, pk):
        if not request.user.is_superuser:
            return Response({'detail': 'Superuser only.'}, status=status.HTTP_403_FORBIDDEN)
        user = get_object_or_404(User, pk=pk)
        is_active = request.data.get('is_active')
        if is_active is not None:
            user.is_active = _to_bool(is_active)
        is_staff = request.data.get('is_staff')
        if is_staff is not None:
            user.is_staff = _to_bool(is_staff)
        user.save()
        AuditLog.objects.log(
            actor=request.user, action='ADMIN_USER_UPDATE',
            object_type='user', object_id=user.id,
            detail='Admin updated account flags',
        )
        return Response({'detail': 'User updated.'})


class AdminDocumentsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        docs = Document.objects.select_related('user').order_by('-created_at')[:300]
        data = [{
            'id': d.id, 'title': d.title, 'user': d.user.username,
            'category': d.category, 'importance': d.importance,
            'is_deleted': d.is_deleted, 'created_at': d.created_at,
            'view_count': d.view_count, 'download_count': d.download_count,
        } for d in docs]
        return Response(data)


class AdminDocumentDecryptView(APIView):
    """Decrypt a document's content for admin inspection (audited)."""
    permission_classes = [IsAdmin]

    @rate_limit(calls=30, period=60)
    def post(self, request, pk):
        doc = get_object_or_404(Document, pk=pk)
        content = doc.decrypt_content()
        if isinstance(content, bytes):
            content = content.decode('utf-8', errors='ignore')
        encrypted_blob = doc.encrypted_file or b''
        encrypted_preview = ''
        if isinstance(encrypted_blob, bytes):
            encrypted_preview = encrypted_blob[:80].hex()
        AuditLog.objects.log(
            actor=request.user, action='ADMIN_DECRYPT',
            object_type='document', object_id=doc.id,
            detail='Admin decrypted "{0}"'.format(doc.title),
        )
        return Response({
            'id': doc.id, 'title': doc.title, 'owner': doc.user.username,
            'content': content or '',
            'encrypted_preview': encrypted_preview,
        })


class AdminAuditView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        logs = AuditLog.objects.select_related('actor').order_by('-created_at')[:300]
        data = [{
            'id': l.id, 'actor': getattr(l.actor, 'username', None),
            'action': l.action, 'object_type': l.object_type,
            'object_id': l.object_id, 'detail': l.detail,
            'ip_address': l.ip_address, 'severity': l.severity,
            'created_at': l.created_at,
        } for l in logs]
        return Response(data)