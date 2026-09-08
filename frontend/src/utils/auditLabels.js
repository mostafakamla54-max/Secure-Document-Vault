import React from 'react';
import Chip from '@mui/material/Chip';

export const ACTION_LABELS = {
  AUTH_LOGIN_OK: 'تسجيل دخول ناجح',
  AUTH_LOGIN_FAIL: 'محاولة دخول فاشلة',
  LOGIN: 'تسجيل دخول',
  LOGOUT: 'تسجيل خروج',
  REGISTER: 'إنشاء حساب جديد',
  PASSWORD_CHANGE: 'تغيير كلمة المرور',
  PASSWORD_RESET_REQUEST: 'طلب استعادة كلمة المرور',
  PASSWORD_RESET_CONFIRM: 'استعادة كلمة المرور',
  TWOFA_ENABLE: 'تفعيل المصادقة الثنائية',
  TWOFA_DISABLE: 'تعطيل المصادقة الثنائية',
  DOCUMENT_CREATE: 'إنشاء وثيقة',
  DOCUMENT_UPDATE: 'تعديل وثيقة',
  DOCUMENT_DELETE: 'حذف وثيقة',
  DOCUMENT_RESTORE: 'استعادة وثيقة',
  DOCUMENT_DOWNLOAD: 'تحميل وثيقة',
  DOCUMENT_DECRYPT: 'فك تشفير وثيقة',
  DOCUMENT_VIEW: 'عرض وثيقة',
  DOCUMENT_VIEW_ENCRYPTED: 'عرض النص المشفر',
  DOCUMENT_AI_ANALYZE: 'تحليل بالذكاء الاصطناعي',
  DOCUMENT_PURGE: 'حذف نهائي لوثيقة',
  SHARE_CREATE: 'مشاركة وثيقة',
  SHARE_REVOKE: 'إلغاء مشاركة وثيقة',
  ORGANIZATION_CREATED: 'إنشاء مؤسسة',
  ORGANIZATION_UPDATED: 'تحديث إعدادات المؤسسة',
  ORG_DOCUMENT_SHARED: 'مشاركة وثيقة مع المؤسسة',
  ORG_DOCUMENT_UNSHARED: 'إزالة وثيقة من المؤسسة',
  MEMBER_ADDED: 'إضافة عضو للمؤسسة',
  MEMBER_UPDATED: 'تحديث دور عضو',
  MEMBER_REMOVED: 'إزالة عضو من المؤسسة',
  ORG_INVITE_CREATED: 'إرسال دعوة مؤسسة',
  ORG_INVITE_ACCEPTED: 'قبول دعوة مؤسسة',
  ADMIN_DECRYPT: 'فك تشفير (إدارة)',
  ADMIN_USER_UPDATE: 'تحديث مستخدم (إدارة)',
  AI_KEYS_UPDATED: 'تحديث مفاتيح الذكاء الاصطناعي',
};

const OBJECT_LABELS = {
  account: 'حساب', auth: 'حساب', document: 'وثيقة', share: 'مشاركة',
  user: 'مستخدم', organization: 'مؤسسة', system: 'نظام', security: 'أمان',
};

const SEVERITY_LABELS = { info: 'معلومة', warning: 'تحذير', high: 'عالية', critical: 'حرجة' };
const SEVERITY_COLORS = { info: '#1976d2', warning: '#b7791f', high: '#c05621', critical: '#c53030' };

export function actionLabel(action) {
  const a = action || '';
  return ACTION_LABELS[a] || String(a).replace(/_/g, ' ') || a;
}

export function objectLabel(type) {
  return OBJECT_LABELS[type] || type || '-';
}

export function severityLabel(sev) {
  return SEVERITY_LABELS[sev] || sev || 'معلومة';
}

export function severityChip(sev) {
  return <Chip size="small" label={severityLabel(sev)} sx={{ color: SEVERITY_COLORS[sev] || '#4a5568', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.06)' }} />;
}

export function objectChip(type) {
  return <Chip size="small" label={objectLabel(type)} sx={{ fontWeight: 700 }} />;
}

export function fmtTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}