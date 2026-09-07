from django.contrib import admin

from .models import Organization, OrganizationInvitation, OrganizationMember


class OrganizationMemberInline(admin.TabularInline):
    model = OrganizationMember
    extra = 0
    autocomplete_fields = ['user']


class OrganizationInvitationInline(admin.TabularInline):
    model = OrganizationInvitation
    extra = 0


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'require_2fa', 'allow_member_upload', 'is_active', 'created_at']
    list_filter = ['require_2fa', 'allow_member_upload', 'is_active']
    search_fields = ['name', 'slug', 'description']
    prepopulated_fields = {'slug': ['name']}
    inlines = [OrganizationMemberInline, OrganizationInvitationInline]


@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin):
    list_display = ['organization', 'user', 'role', 'is_active', 'joined_at']
    list_filter = ['role', 'is_active']
    search_fields = ['organization__name', 'user__username', 'user__email']
    autocomplete_fields = ['user']


@admin.register(OrganizationInvitation)
class OrganizationInvitationAdmin(admin.ModelAdmin):
    list_display = ['organization', 'email', 'role', 'status', 'created_at', 'expires_at']
    list_filter = ['status', 'role']
    search_fields = ['organization__name', 'email']