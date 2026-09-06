from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.models import AuditLog
from apps.documents.models import Document
from middleware.rate_limit import rate_limit

from .models import DocumentShare, SharedDocumentAccessLog, ShareInvitation
from .serializers import (
    DocumentShareSerializer,
    generate_share_token,
    ShareCreateSerializer,
    ShareInvitationSerializer,
)

User = get_user_model()


class ShareViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentShareSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DocumentShare.objects.filter(
            shared_by=self.request.user
        ).select_related('document', 'shared_with')

    def create(self, request, *args, **kwargs):
        serializer = ShareCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        doc = get_object_or_404(
            Document, pk=data['document_id'], user=request.user, is_deleted=False
        )

        shared_with = None
        email = (data.get('email') or '').strip().lower()
        if email:
            try:
                shared_with = User.objects.get(email=email)
            except User.DoesNotExist:
                pass

        share = DocumentShare.objects.create(
            document=doc,
            shared_by=request.user,
            shared_with=shared_with,
            email=email,
            permission=data['permission'],
            message=data.get('message', ''),
            expires_at=data.get('expires_at'),
            access_token=generate_share_token(),
        )

        if email:
            invitation = ShareInvitation.objects.create(
                share=share,
                email=email,
                token=generate_share_token(),
            )

        AuditLog.objects.log(
            actor=request.user,
            action='SHARE_CREATE',
            object_type='share',
            object_id=share.id,
            detail=f'Shared "{doc.title}" as link {share.access_token[:8]}... ({data["permission"]})',
        )

        if email:
            self._send_invitation(request, share)
        return Response(
            DocumentShareSerializer(share, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    def destroy(self, request, *args, **kwargs):
        share = self.get_object()
        AuditLog.objects.log(
            actor=request.user,
            action='SHARE_REVOKE',
            object_type='share',
            object_id=share.id,
            detail=f'Revoked access to "{share.document.title}" for {share.email or share.shared_with}',
        )
        share.is_active = False
        share.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _send_invitation(self, request, share):
        base = f"{request.scheme}://{request.get_host()}"
        link = f"{base}/shared/{share.access_token}"
        html = render_to_string('emails/share_invitation.html', {
            'inviter': share.shared_by,
            'document': share.document.title,
            'permission': share.get_permission_display(),
            'link': link,
        })
        send_mail(
            subject=f'{share.shared_by.username} shared a document with you',
            message=f'View it here: {link}',
            from_email=None,
            recipient_list=[share.email],
            html_message=html,
        )


class ReceivedSharesView(APIView):
    """List shares received by the current user (or via email match)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        shares = DocumentShare.objects.filter(
            is_active=True, email=request.user.email
        ).exclude(shared_by=request.user)
        if request.user.email:
            shares = shares | DocumentShare.objects.filter(
                shared_with=request.user, is_active=True
            ).exclude(shared_by=request.user)
        shares = shares.select_related('document', 'shared_by').distinct()
        return Response(DocumentShareSerializer(shares, many=True).data)


class PublicShareAccessView(APIView):
    """Access a shared document via access token (no auth required)."""
    permission_classes = [permissions.AllowAny]

    def _client_info(self, request):
        ua = request.META.get('HTTP_USER_AGENT', '')
        lower = ua.lower()
        browser = 'Unknown'
        if 'edg/' in lower:
            browser = 'Edge'
        elif 'chrome/' in lower:
            browser = 'Chrome'
        elif 'firefox/' in lower:
            browser = 'Firefox'
        elif 'safari/' in lower:
            browser = 'Safari'
        elif 'opr/' in lower or 'opera' in lower:
            browser = 'Opera'
        device = 'Desktop'
        if 'mobile' in lower or 'iphone' in lower or 'android' in lower:
            device = 'Mobile'
        elif 'ipad' in lower or 'tablet' in lower:
            device = 'Tablet'
        os_name = 'Unknown'
        if 'windows' in lower:
            os_name = 'Windows'
        elif 'android' in lower:
            os_name = 'Android'
        elif 'iphone' in lower or 'ios' in lower or 'mac os' in lower:
            os_name = 'Apple'
        elif 'linux' in lower:
            os_name = 'Linux'
        return {'user_agent': ua[:400], 'device': device, 'browser': browser, 'os': os_name}

    @rate_limit(calls=30, period=60)
    def get(self, request, token):
        share = get_object_or_404(DocumentShare, access_token=token)
        if not share.can_access():
            return Response({'detail': 'This share is no longer active or has expired.'},
                            status=status.HTTP_403_FORBIDDEN)
        if share.max_opens and share.view_count >= share.max_opens:
            return Response({'detail': 'This share has reached its maximum number of views.'},
                            status=status.HTTP_403_FORBIDDEN)
        if share.password_hash:
            pwd = request.GET.get('password') or request.data.get('password') if hasattr(request, 'data') else request.GET.get('password')
            if not share.accepts_password(pwd):
                return Response({'detail': 'password_required', 'message': 'This link is protected by a password.'},
                                status=status.HTTP_401_UNAUTHORIZED)

        info = self._client_info(request)
        ip = request.META.get('REMOTE_ADDR')
        from django.contrib.gis.geoip2 import GeoIP2
        try:
            geo = str(GeoIP2().city(ip) or '')
        except Exception:
            geo = ''

        if request.query_params.get('download') == '1':
            if not share.download_allowed:
                return Response({'detail': 'Downloading is not allowed for this share.'},
                                status=status.HTTP_403_FORBIDDEN)
            content = share.document.decrypt_content()
            share.record_access()
            SharedDocumentAccessLog.objects.create(
                share=share, user=request.user if request.user.is_authenticated else None,
                ip_address=ip, action='DOWNLOAD', **info, geo=geo,
            )
            self._notify_owner(share, 'download')
            from django.http import HttpResponse
            response = HttpResponse(content, content_type=share.document.mime_type or 'application/octet-stream')
            response['Content-Disposition'] = f'attachment; filename="{share.document.original_filename}"'
            return response

        content = share.document.decrypt_content()
        share.record_access()
        SharedDocumentAccessLog.objects.create(
            share=share, user=request.user if request.user.is_authenticated else None,
            ip_address=ip, action='VIEW', **info, geo=geo,
        )
        self._notify_owner(share, 'view')

        from django.utils import timezone
        remaining_days = None
        if share.expires_at:
            remaining_days = max(0, (share.expires_at - timezone.now()).days)
        return Response({
            'title': share.document.title,
            'description': share.document.description,
            'original_filename': share.document.original_filename,
            'mime_type': share.document.mime_type,
            'file_size': share.document.file_size,
            'shared_by': share.shared_by.get_full_name() or share.shared_by.username,
            'created_at': share.document.created_at,
            'permission': share.permission,
            'expires_at': share.expires_at,
            'remaining_days': remaining_days,
            'download_allowed': share.download_allowed,
            'max_opens': share.max_opens,
            'views_used': share.view_count,
            'decrypted': content.hex() if not request.query_params.get('raw') else None,
        })

    def _notify_owner(self, share, action):
        from apps.accounts.models import Notification
        if action == 'view':
            title = 'فتح رابط مشاركة'
            msg = f'تم فتح رابط مشاركة "{share.document.title}" بواسطة شخص ما.'
        else:
            title = 'تنزيل من رابط مشاركة'
            msg = f'تم تنزيل "{share.document.title}" من رابط المشاركة الخاص بك.'
        try:
            Notification.objects.create(
                user=share.shared_by, type='share', title=title, message=msg,
                link=f'/sharing', priority='normal',
            )
        except Exception:
            pass


class InvitationViewSet(viewsets.ModelViewSet):
    serializer_class = ShareInvitationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ShareInvitation.objects.filter(share__shared_by=self.request.user).select_related('share')


class ShareAnalyticsView(APIView):
    """Detailed access analytics for the owner of a share."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        share = get_object_or_404(DocumentShare, pk=pk, shared_by=request.user)
        logs = SharedDocumentAccessLog.objects.filter(share=share).order_by('-created_at')[:100]
        return Response({
            'share_id': share.id,
            'document': share.document.title,
            'access_url': DocumentShareSerializer(share, context={'request': request}).data.get('access_url'),
            'view_count': share.view_count,
            'max_opens': share.max_opens,
            'is_active': share.is_active,
            'logs': [
                {
                    'action': log.action,
                    'created_at': log.created_at,
                    'ip_address': log.ip_address,
                    'device': log.device,
                    'browser': log.browser,
                    'os': log.os,
                    'geo': log.geo,
                    'user': log.user.username if log.user else None,
                }
                for log in logs
            ],
        })
