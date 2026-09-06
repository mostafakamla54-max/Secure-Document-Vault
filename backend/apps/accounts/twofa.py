import base64

import pyotp
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from django.apps import apps
from middleware.rate_limit import rate_limit
from utils.helpers import standard_response
from apps.audit.models import AuditLog
from .serializers import LoginSerializer
from .services import create_active_session

APP_NAME = getattr(apps.get_app_config('accounts'), 'verbose_name', 'Secure Vault') or 'Secure Vault'
User = get_user_model()


def _secret_for(user):
    if not user.two_factor_secret:
        user.two_factor_secret = pyotp.random_base32()
        user.save(update_fields=['two_factor_secret'])
    return user.two_factor_secret


def _provisioning_uri(user, secret):
    return pyotp.totp.TOTP(secret).provisioning_uri(
        name=user.email or user.username,
        issuer_name=APP_NAME,
    )


def _verify_code(secret, code):
    if not secret or not code:
        return False
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)


class TwoFactorStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(standard_response(True, 'ok', data={
            'enabled': user.two_factor_enabled,
            'email': user.email,
        }))


class TwoFactorSetupView(APIView):
    """Generate a secret + provisioning URI (does not enable yet)."""
    permission_classes = [permissions.IsAuthenticated]

    @rate_limit(calls=10, period=60)
    def post(self, request):
        user = request.user
        if user.two_factor_enabled:
            return Response(standard_response(False, {'detail': '2FA is already enabled.'}),
                            status=status.HTTP_400_BAD_REQUEST)
        secret = _secret_for(user)
        uri = _provisioning_uri(user, secret)
        return Response(standard_response(True, 'ok', data={
            'secret': secret,
            'provisioning_uri': uri,
        }))


class TwoFactorEnableView(APIView):
    """Enable 2FA after verifying a TOTP code."""
    permission_classes = [permissions.IsAuthenticated]

    @rate_limit(calls=5, period=60)
    def post(self, request):
        user = request.user
        code = (request.data.get('code') or '').strip()
        secret = user.two_factor_secret or _secret_for(user)
        if not _verify_code(secret, code):
            return Response(standard_response(False, {'detail': 'Invalid or expired code.'}),
                            status=status.HTTP_400_BAD_REQUEST)
        user.two_factor_enabled = True
        user.two_factor_secret = secret
        user.save(update_fields=['two_factor_enabled', 'two_factor_secret'])
        from apps.audit.models import AuditLog
        AuditLog.objects.log(
            actor=user, action='TWOFA_ENABLE', object_type='account',
            object_id=user.id, detail='Enabled two-factor authentication',
        )
        return Response(standard_response(True, 'ok', data={'enabled': True}))


class TwoFactorDisableView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @rate_limit(calls=5, period=60)
    def post(self, request):
        user = request.user
        code = (request.data.get('code') or '').strip()
        secret = user.two_factor_secret
        if secret and not _verify_code(secret, code):
            return Response(standard_response(False, {'detail': 'Invalid code.'}),
                            status=status.HTTP_400_BAD_REQUEST)
        user.two_factor_enabled = False
        user.save(update_fields=['two_factor_enabled'])
        AuditLog.objects.log(
            actor=user, action='TWOFA_DISABLE', object_type='account',
            object_id=user.id, detail='Disabled two-factor authentication',
        )
        return Response(standard_response(True, 'ok', data={'enabled': False}))


def make_twofa_challenge(user):
    """Short-lived signed token (5 min) issued after a successful password check."""
    return TimestampSigner().sign(str(user.pk))


class TwoFactorLoginView(APIView):
    """Complete login with an OTP after the password step (skipped if 2FA is off)."""
    permission_classes = [permissions.AllowAny]
    http_method_names = ['post']

    @rate_limit(calls=5, period=60)
    def post(self, request):
        token = (request.data.get('twofa_token') or '').strip()
        code = (request.data.get('code') or '').strip()
        if not token or not code:
            return Response(standard_response(False, 'Invalid request.'),
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            user_id = int(TimestampSigner().unsign(token, max_age=300))
        except (BadSignature, SignatureExpired, TypeError, ValueError):
            return Response(
                standard_response(False, 'انتهت صلاحية جلسة التحقق، سجّل الدخول من جديد.'),
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = User.objects.get(pk=user_id)
        if not user.is_active:
            return Response(standard_response(False, 'هذا الحساب معطّل'),
                            status=status.HTTP_403_FORBIDDEN)
        if not _verify_code(user.two_factor_secret, code):
            AuditLog.objects.log(
                actor=user, action='AUTH_2FA_FAILED', object_type='account',
                object_id=user.id, detail='Invalid 2FA code at login',
            )
            return Response(standard_response(False, 'الرمز غير صحيح أو منتهي الصلاحية'),
                            status=status.HTTP_401_UNAUTHORIZED)
        refresh = LoginSerializer.get_token(user)
        data = {'refresh': str(refresh), 'access': str(refresh.access_token)}
        create_active_session(user, request)
        AuditLog.objects.log(
            actor=user, action='AUTH_2FA_LOGIN', object_type='account',
            object_id=user.id, detail='Logged in with 2FA code',
        )
        return Response(data)
