import base64

import pyotp
from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from django.apps import apps
from utils.helpers import standard_response

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

    def post(self, request):
        user = request.user
        code = (request.data.get('code') or '').strip()
        secret = user.two_factor_secret
        if secret and not _verify_code(secret, code):
            return Response(standard_response(False, {'detail': 'Invalid code.'}),
                            status=status.HTTP_400_BAD_REQUEST)
        user.two_factor_enabled = False
        user.save(update_fields=['two_factor_enabled'])
        from apps.audit.models import AuditLog
        AuditLog.objects.log(
            actor=user, action='TWOFA_DISABLE', object_type='account',
            object_id=user.id, detail='Disabled two-factor authentication',
        )
        return Response(standard_response(True, 'ok', data={'enabled': False}))
