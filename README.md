# Secure Document Vault

نظام إدارة وثائق آمن ومشفر (Secure Document Vault) — تطبيق ويب كامل الحزمة (Full-Stack) لإدارة الوثائق الحساسة مع تشفير قوي وسجل تدقيق شامل.

## المميزات الرئيسية

- **تشفير AES-256-GCM** مع مفتاح مشتق لكل وثيقة (PBKDF2) للمحتوى
- **مصادقة JWT** مع تدوير وتبييض الرموز (token rotation & blacklisting)
- **قفل الحساب** بعد 5 محاولات فاشلة
- **مدقق كلمات مرور** صارم (bcrypt 12 rounds)
- **مشاركة آمنة** للوثائق مع صلاحيات (عرض/تحرير/تعليق) وتاريخ انتهاء
- **سجل تدقيق كامل** لجميع العمليات الحساسة
- **حماية**: rate limiting, security headers, CORS مضبوط
- **واجهة عربية** متجاوبة مع وضع داكن/فاتح

## التقنيات

| الطبقة | التقنية |
|--------|---------|
| الباك-إند | Django 4.2 + Django REST Framework |
| قاعدة البيانات | PostgreSQL (SQLite للتطوير) |
| التشفير | cryptography (AES-256-GCM, PBKDF2) |
| المصادقة | SimpleJWT + bcrypt |
| المهام | Celery + Redis |
| الواجهة | React 18 + Material UI + Redux Toolkit |
| الحاوية | Docker + docker-compose |

## هيكل المشروع

```
Secure Document Vault/
├── backend/          # Python Backend (Django + DRF)
│   ├── config/       # إعدادات Django
│   ├── apps/
│   │   ├── accounts/ # المستخدمون والمصادقة
│   │   ├── documents/# الوثائق والتشفير
│   │   ├── sharing/  # المشاركة الآمنة
│   │   └── audit/    # سجل التدقيق
│   ├── middleware/   # أمان، تحديد معدل، تسجيل
│   ├── utils/        # أدوات مساعدة
│   └── templates/    # قوالب الإيميلات
├── frontend/         # React Frontend
├── docker/           # Nginx, Postgres, Redis configs
├── docs/             # التوثيق
└── scripts/          # أدوات (توليد مفاتيح، نسخ احتياطي...)
```

## البدء السريع (تطوير محلي بدون Docker)

### المتطلبات
- Python 3.10+
- Node 16+

### الباك-إند
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# إنشاء مفتاح التشفير
python scripts/../scripts/generate_key.py

# إعداد .env (انسخ من .env.example)
copy .env.example .env

python manage.py makemigrations accounts documents sharing audit
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### الواجهة الأمامية
```bash
cd frontend
npm install
npm start
```

## البيانات الافتراضية
- لوحة الإدارة: `http://127.0.0.1:8000/admin/`
- الواجهة: `http://localhost:3000`

## التوثيق
انظر مجلد `docs/` للتوثيق الكامل (API, Security, Risk, Testing, User Guide, Developer Guide).
