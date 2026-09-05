from rest_framework import mixins, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['action', 'object_type', 'severity']

    def get_queryset(self):
        qs = AuditLog.objects.all()
        if not self.request.user.is_superuser:
            qs = qs.filter(actor=self.request.user)
        return qs.select_related('actor')


class MyAuditLogView(APIView):
    """Audit trail for the current user (admins see everything via the viewset)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        logs = AuditLog.objects.filter(actor=request.user).select_related('actor')
        return Response(AuditLogSerializer(logs, many=True).data)


class SecurityDashboardView(APIView):
    """Summary of security-related events for the current admin user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_superuser:
            return Response({'detail': 'Forbidden.'}, status=403)
        qs = AuditLog.objects.all()
        return Response({
            'total_events': qs.count(),
            'failed_logins': qs.filter(action__icontains='FAILED').count(),
            'document_activity': qs.filter(object_type='document').count(),
            'share_activity': qs.filter(object_type='share').count(),
            'critical_events': qs.filter(severity__in=['high', 'critical']).count(),
        })
