import os
from pathlib import Path

from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.models import AuditLog

ENV_PATH = Path(settings.BASE_DIR) / '.env'


def _set_env_key(key, value):
    value = value.strip()
    if not ENV_PATH.exists():
        ENV_PATH.write_text('', encoding='utf-8')
    lines = ENV_PATH.read_text(encoding='utf-8').splitlines()
    seen = False
    for i, line in enumerate(lines):
        if line.strip().startswith(key + '='):
            lines[i] = key + '=' + value
            seen = True
            break
    if not seen:
        lines.append(key + '=' + value)
    ENV_PATH.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    os.environ[key] = value


class AiSettingsView(APIView):
    """View + update OpenAI/Claude API keys, stored permanently in backend/.env."""
    permission_classes = [permissions.IsAuthenticated]

    def _is_admin(self, request):
        return bool(getattr(request.user, 'is_superuser', False) or
                    getattr(request.user, 'is_staff', False))

    def get(self, request):
        is_admin = self._is_admin(request)
        payload = {
            'is_admin': is_admin,
            'note': 'Keys are stored locally in backend/.env and never returned in full.',
        }
        if is_admin:
            payload['openai_configured'] = bool(os.environ.get('OPENAI_API_KEY', ''))
            payload['claude_configured'] = bool(os.environ.get('CLAUDE_API_KEY', ''))
        return Response(payload)

    def post(self, request):
        if not self._is_admin(request):
            return Response({'detail': 'Admins only.'}, status=status.HTTP_403_FORBIDDEN)
        openai_key = request.data.get('openai_api_key', '').strip()
        claude_key = request.data.get('claude_api_key', '').strip()
        if openai_key:
            _set_env_key('OPENAI_API_KEY', openai_key)
        if claude_key:
            _set_env_key('CLAUDE_API_KEY', claude_key)
        AuditLog.objects.log(
            actor=request.user, action='AI_KEYS_UPDATED',
            object_type='settings', object_id=None,
            detail='Admin updated AI API keys',
        )
        return Response({'detail': 'Keys saved permanently.'})