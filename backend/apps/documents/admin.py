from django.contrib import admin

from .models import Document, DocumentTag, DocumentTagLink, DocumentVersion


class DocumentVersionInline(admin.TabularInline):
    model = DocumentVersion
    extra = 0
    readonly_fields = ('version_number', 'file_size', 'checksum', 'change_summary', 'created_at')
    can_delete = False


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'category', 'importance', 'file_size',
                    'view_count', 'is_archived', 'is_favorite', 'is_deleted', 'created_at')
    list_filter = ('category', 'importance', 'is_archived', 'is_favorite', 'is_deleted', 'created_at')
    search_fields = ('title', 'description', 'user__username')
    readonly_fields = ('checksum', 'file_size', 'view_count', 'download_count', 'created_at', 'updated_at')
    inlines = [DocumentVersionInline]


@admin.register(DocumentTag)
class DocumentTagAdmin(admin.ModelAdmin):
    list_display = ('name', 'color', 'user')
    search_fields = ('name', 'user__username')


@admin.register(DocumentTagLink)
class DocumentTagLinkAdmin(admin.ModelAdmin):
    list_display = ('document', 'tag')
