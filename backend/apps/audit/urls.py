from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AuditLogViewSet, MyAuditLogView, SecurityDashboardView

router = DefaultRouter()
router.register(r'logs', AuditLogViewSet, basename='audit-logs')

urlpatterns = [
    path('my-logs/', MyAuditLogView.as_view(), name='my-audit-logs'),
    path('security/dashboard/', SecurityDashboardView.as_view(), name='security-dashboard'),
    path('', include(router.urls)),
]
