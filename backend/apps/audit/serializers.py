import re

from rest_framework import serializers

from .models import AuditLog
from apps.documents.models import Document

REPLACEMENT_CHAR = '\ufffd'

DETAIL_AR = {
    'AUTH_LOGIN_OK': 'تم تسجيل الدخول بنجاح',
    'AUTH_LOGIN_FAIL': 'محاولة تسجيل دخول فاشلة',
    'REGISTER': 'تم إنشاء حساب جديد',
    'LOGOUT': 'تم تسجيل الخروج',
    'PASSWORD_CHANGE': 'تم تغيير كلمة المرور',
    'PASSWORD_RESET_REQUEST': 'تم طلب استعادة كلمة المرور',
    'PASSWORD_RESET_CONFIRM': 'تمت استعادة كلمة المرور',
    'TWOFA_ENABLE': 'تم تفعيل المصادقة الثنائية',
    'TWOFA_DISABLE': 'تم تعطيل المصادقة الثنائية',
    'DOCUMENT_CREATE': 'تم إنشاء الوثيقة \u201c{title}\u201d',
    'DOCUMENT_UPDATE': 'تم تعديل الوثيقة \u201c{title}\u201d',
    'DOCUMENT_DELETE': 'تم حذف الوثيقة \u201c{title}\u201d',
    'DOCUMENT_RESTORE': 'تمت استعادة الوثيقة \u201c{title}\u201d',
    'DOCUMENT_DOWNLOAD': 'تم تحميل الوثيقة \u201c{title}\u201d',
    'DOCUMENT_DECRYPT': 'تم فك تشفير الوثيقة \u201c{title}\u201d',
    'DOCUMENT_VIEW': 'تم عرض الوثيقة \u201c{title}\u201d',
    'DOCUMENT_VIEW_ENCRYPTED': 'تم عرض النص المشفر للوثيقة \u201c{title}\u201d',
    'DOCUMENT_AI_ANALYZE': 'تم تحليل الوثيقة \u201c{title}\u201d بالذكاء الاصطناعي',
    'DOCUMENT_PURGE': 'تم حذف الوثيقة نهائياً \u201c{title}\u201d',
    'SHARE_CREATE': 'تمت مشاركة الوثيقة \u201c{title}\u201d',
    'SHARE_REVOKE': 'تم إلغاء مشاركة الوثيقة \u201c{title}\u201d',
    'ADMIN_DECRYPT': 'قام المدير بفك تشفير الوثيقة \u201c{title}\u201d',
    'ORGANIZATION_CREATED': 'تم إنشاء المؤسسة \u201c{title}\u201d',
    'ORGANIZATION_UPDATED': 'تم تحديث إعدادات المؤسسة',
    'ORG_DOCUMENT_SHARED': 'تمت مشاركة الوثيقة \u201c{title}\u201d مع المؤسسة',
    'ORG_DOCUMENT_UNSHARED': 'تمت إزالة الوثيقة \u201c{title}\u201d من المؤسسة',
    'MEMBER_ADDED': 'تمت إضافة عضو إلى المؤسسة',
    'MEMBER_UPDATED': 'تم تحديث دور عضو في المؤسسة',
    'MEMBER_REMOVED': 'تمت إزالة عضو من المؤسسة',
    'ORG_INVITE_CREATED': 'تم إرسال دعوة انضمام إلى {email}',
    'ORG_INVITE_ACCEPTED': 'تم قبول دعوة الانضمام للمؤسسة',
    'ADMIN_USER_UPDATE': 'تم تحديث بيانات مستخدم (من الإدارة)',
    'AI_KEYS_UPDATED': 'تم تحديث مفاتيح الذكاء الاصطناعي',
}

EMAIL_RE = re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')
QUOTED_RE = re.compile(r'"([^"]+)"')


def _translate_detail(action, detail):
    template = DETAIL_AR.get(action)
    if not template:
        return detail
    if '{title}' in template:
        title = None
        m = QUOTED_RE.search(detail or '')
        if m:
            title = m.group(1)
        if title and REPLACEMENT_CHAR not in title and title.strip():
            return template.format(title=title.strip())
        return template.format(title='...')
    if '{email}' in template:
        m = EMAIL_RE.search(detail or '')
        return template.format(email=m.group(0) if m else '-')
    return template


def _rebuild_detail(obj):
    template = DETAIL_AR.get(obj.action)
    if not template:
        return obj.detail
    if '{title}' in template:
        title = ''
        if obj.object_type == 'document' and str(obj.object_id or '').isdigit():
            title = Document.objects.filter(pk=int(obj.object_id)).values_list('title', flat=True).first() or ''
        return template.format(title=title or '...')
    if '{email}' in template:
        m = EMAIL_RE.search(obj.detail or '')
        return template.format(email=m.group(0) if m else '-')
    return template


class AuditLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='actor.username', read_only=True)
    detail = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ['id', 'actor', 'actor_username', 'action', 'object_type',
                  'object_id', 'detail', 'severity', 'created_at']
        read_only_fields = fields

    def get_detail(self, obj):
        if not obj.detail:
            return ''
        if REPLACEMENT_CHAR in obj.detail:
            return _rebuild_detail(obj)
        return _translate_detail(obj.action, obj.detail)