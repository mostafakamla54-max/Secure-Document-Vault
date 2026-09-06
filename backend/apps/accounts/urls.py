from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ActiveSessionViewSet,
    ChangePasswordView,
    LoginView,
    LogoutView,
    NotificationViewSet,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    ProfileView,
    RegisterView,
    VerifyEmailView,
)
from .views_ai import AiSettingsView
from .twofa import (
    TwoFactorDisableView,
    TwoFactorEnableView,
    TwoFactorLoginView,
    TwoFactorSetupView,
    TwoFactorStatusView,
)

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'sessions', ActiveSessionViewSet, basename='sessions')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify-email'),
    path('login/', LoginView.as_view(), name='login'),
    path('login/2fa/', TwoFactorLoginView.as_view(), name='login-2fa'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('2fa/status/', TwoFactorStatusView.as_view(), name='2fa-status'),
    path('ai-settings/', AiSettingsView.as_view(), name='ai-settings'),
    path('2fa/setup/', TwoFactorSetupView.as_view(), name='2fa-setup'),
    path('2fa/enable/', TwoFactorEnableView.as_view(), name='2fa-enable'),
    path('2fa/disable/', TwoFactorDisableView.as_view(), name='2fa-disable'),
    path('', include(router.urls)),
]
