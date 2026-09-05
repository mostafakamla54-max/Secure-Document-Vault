from django.contrib import admin

from .models import DocumentShare, ShareInvitation, SharedDocumentAccessLog


@admin.register(DocumentShare)
class DocumentShareAdmin(admin.ModelAdmin):
    list_display = ('document', 'shared_by', 'shared_with', 'email', 'permission',
                    'is_active', 'is_viewed', 'view_count', 'expires_at', 'created_at')
    list_filter = ('permission', 'is_active', 'is_viewed', 'created_at')
    search_fields = ('document__title', 'shared_by__username', 'email', 'shared_with__username')
    readonly_fields = ('access_token', 'view_count', 'last_accessed_at', 'created_at')
    date_hierarchy = 'created_at'


@admin.register(ShareInvitation)
class ShareInvitationAdmin(admin.ModelAdmin):
    list_display = ('email', 'share', 'status', 'created_at', 'accepted_at')
    list_filter = ('status', 'created_at')
    search_fields = ('email', 'token')


@admin.register(SharedDocumentAccessLog)
class SharedDocumentAccessLogAdmin(admin.ModelAdmin):
    list_display = ('share', 'user', 'action', 'ip_address', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('user__username', 'ip_address')
    readonly_fields = ('created_at',)
