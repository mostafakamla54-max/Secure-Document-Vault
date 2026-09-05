from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="Secure Document Vault API",
        default_version='v1',
        description="API for encrypted document management system",
        contact=openapi.Contact(email="admin@securevault.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/accounts/', include('apps.accounts.urls')),
    path('api/v1/documents/', include('apps.documents.urls')),
    path('api/v1/sharing/', include('apps.sharing.urls')),
    path('api/v1/audit/', include('apps.audit.urls')),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Serve the built React SPA (single origin for UI + API, so no CORS is needed).
# This must come LAST and must not shadow API/admin/documentation routes.
urlpatterns += [
    re_path(
        r'^(?!api/|admin/|swagger/|redoc/|media/|static/).*$',
        TemplateView.as_view(template_name='index.html'),
        name='spa',
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
