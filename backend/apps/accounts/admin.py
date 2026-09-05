from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from .models import ActiveSession, Notification, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_active',
                    'is_staff', 'email_verified', 'two_factor_enabled', 'created_at')
    list_filter = ('is_active', 'is_staff', 'email_verified', 'two_factor_enabled', 'created_at')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'failed_login_attempts', 'locked_until')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'email',
                                         'phone_number', 'organization', 'profile_image')}),
        (_('Security'), {'fields': ('two_factor_enabled', 'two_factor_secret',
                                    'email_verified', 'failed_login_attempts',
                                    'locked_until', 'email_verification_token',
                                    'password_reset_token', 'password_reset_expires',
                                    'password_changed_at')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser',
                                       'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )


@admin.register(ActiveSession)
class ActiveSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'browser', 'os', 'ip_address', 'is_active',
                    'expires_at', 'last_activity')
    list_filter = ('is_active', 'device_type', 'browser', 'os')
    search_fields = ('user__username', 'user__email', 'ip_address')
    readonly_fields = ('created_at', 'last_activity')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'type', 'priority', 'is_read', 'created_at')
    list_filter = ('type', 'priority', 'is_read', 'created_at')
    search_fields = ('title', 'message', 'user__username')
    readonly_fields = ('created_at',)
