# دليل المطور

## البنية

- **backend/** — Django 4.2 + DRF
  - `apps/accounts` — المستخدمون والمصادقة
  - `apps/documents` — الوثائق والتشفير
  - `apps/sharing` — المشاركة الآمنة
  - `apps/audit` — سجل التدقيق
  - `middleware/` — أمان، تسجيل، تحديد معدل
  - `utils/` — أدوات مساعدة
- **frontend/** — React 18 + Material UI + Redux Toolkit

## التشغيل محلياً

### الباك-إند

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python ../scripts/generate_key.py   # احفظ المفتاح في .env
copy .env.example .env
python manage.py makemigrations accounts documents sharing audit
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### الواجهة

```bash
cd frontend
npm install
npm start
```

## الاختبار

```bash
cd backend
python manage.py test apps.accounts apps.documents apps.sharing apps.audit
```

## Docker

```bash
docker-compose up --build
```

## مفتاح التشفير

- يُنشأ عبر `scripts/generate_key.py`.
- يُخزَّن في `DOCUMENT_ENCRYPTION_KEY` داخل `.env`.
- **لا يُشارك مع الواجهة ولا يُسجَّل.**
