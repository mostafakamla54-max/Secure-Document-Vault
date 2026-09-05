# توثيق API

نظام Secure Document Vault — نقاط النهاية الرئيسية.

## المصادقة

| الطريقة | المسار | الوصف |
|--------|--------|-------|
| POST | `/api/v1/accounts/register/` | إنشاء حساب جديد |
| POST | `/api/v1/accounts/login/` | تسجيل الدخول (JWT) |
| POST | `/api/v1/accounts/refresh/` | تحديث رمز الوصول |
| POST | `/api/v1/accounts/logout/` | تسجيل الخروج |

## الرد الموحد

جميع الردود تُغلَّف في قالب موحد:

```json
{ "success": true, "message": "", "data": {} }
```

## الوثائق

| الطريقة | المسار | الوصف |
|--------|--------|-------|
| GET | `/api/v1/documents/` | قائمة الوثائق |
| POST | `/api/v1/documents/` | رفع وثيقة (multipart) |
| GET | `/api/v1/documents/{id}/` | تفاصيل وثيقة |
| DELETE | `/api/v1/documents/{id}/` | حذف (soft delete) |
| GET | `/api/v1/documents/download/{id}/` | تحميل فك تشفير |

## المشاركة

| الطريقة | المسار | الوصف |
|--------|--------|-------|
| GET | `/api/v1/sharing/` | المشاركات المنشأة |
| POST | `/api/v1/sharing/` | مشاركة وثيقة |
| GET | `/api/v1/sharing/received/` | المشاركات المستلمة |
| GET | `/api/v1/sharing/public/{token}/` | وصول عام برمز |

## سجل التدقيق

| الطريقة | المسار | الوصف |
|--------|--------|-------|
| GET | `/api/v1/audit/logs/` | سجل التدقيق |
| GET | `/api/v1/audit/my-logs/` | سجل المستخدم الحالي |
| GET | `/api/v1/audit/security/dashboard/` | ملخص الأمان (إداري) |

## الصحة العامة

- `swagger/` — واجهة Swagger التفاعلية
- `redoc/` — واجهة ReDoc
- `admin/` — لوحة إدارة Django
