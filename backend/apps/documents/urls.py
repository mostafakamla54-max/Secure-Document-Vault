from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .admin_views import (
    AdminAuditView,
    AdminDocumentDecryptView,
    AdminDocumentsView,
    AdminStatsView,
    AdminUsersView,
)
from .views import (
    DocumentAiAnalyzeView,
    DocumentDecryptTextView,
    DocumentDownloadView,
    DocumentEncryptedTextView,
    DocumentTagViewSet,
    DocumentVersionViewSet,
    DocumentViewSet,
    ToggleArchiveView,
    ToggleFavoriteView,
    TrashView,
)

router = DefaultRouter()
router.register(r'', DocumentViewSet, basename='documents')
router.register(r'tags', DocumentTagViewSet, basename='tags')

urlpatterns = [
    path('download/<int:pk>/', DocumentDownloadView.as_view(), name='document-download'),
    path('encrypted-text/<int:pk>/', DocumentEncryptedTextView.as_view(), name='document-encrypted-text'),
    path('decrypt-text/<int:pk>/', DocumentDecryptTextView.as_view(), name='document-decrypt-text'),
    path('favorite/<int:pk>/', ToggleFavoriteView.as_view(), name='document-favorite'),
    path('archive/<int:pk>/', ToggleArchiveView.as_view(), name='document-archive'),
    path('trash/', TrashView.as_view(), name='trash-list'),
    path('trash/<int:pk>/', TrashView.as_view(), name='trash-detail'),
    path('documents/<int:document_pk>/versions/', DocumentVersionViewSet.as_view({'get': 'list'}),
         name='document-versions'),
    path('ai/analyze/<int:pk>/', DocumentAiAnalyzeView.as_view(), name='document-ai-analyze'),
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('admin/users/', AdminUsersView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/', AdminUsersView.as_view(), name='admin-user-patch'),
    path('admin/documents/', AdminDocumentsView.as_view(), name='admin-documents'),
    path('admin/documents/<int:pk>/decrypt/', AdminDocumentDecryptView.as_view(), name='admin-document-decrypt'),
    path('admin/audit/', AdminAuditView.as_view(), name='admin-audit'),
    path('', include(router.urls)),
]
