from django.contrib import admin
from django.utils.html import format_html

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'actor', 'action', 'object_type', 'object_id',
                    'severity', 'ip_address')
    list_filter = ('action', 'object_type', 'severity', 'created_at')
    search_fields = ('actor__username', 'action', 'object_id', 'detail', 'ip_address')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    list_max_show_all = 100

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
