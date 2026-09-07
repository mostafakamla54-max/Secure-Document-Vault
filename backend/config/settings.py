import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-change-me-in-production')

# Debug is OFF by default; enable explicitly with DJANGO_DEBUG=True in dev only.
DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'

# Restrict hosts via DJANGO_ALLOWED_HOSTS (comma-separated). A wildcard is
# only used as a last-resort fallback when the variable is not configured.
_ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', '')
if _ALLOWED_HOSTS:
    ALLOWED_HOSTS = [h.strip() for h in _ALLOWED_HOSTS.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = ['*']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'django_celery_beat',
    'drf_yasg',
    'apps.accounts',
    'apps.documents',
    'apps.sharing',
    'apps.audit',
    'apps.organizations',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'middleware.security.SecurityHeadersMiddleware',
    'middleware.logging.RequestLoggingMiddleware',
    'middleware.rate_limit.RateLimitMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database: SQLite by default for fast local development.
# Set USE_SQLITE=0 to use PostgreSQL (production / Docker).
# If DATABASE_URL is provided (e.g. Railway Postgres), it always wins.
USE_SQLITE = os.environ.get('USE_SQLITE', '1') == '1'

DATABASE_URL = os.environ.get('DATABASE_URL', '')
if DATABASE_URL:
    import urllib.parse as _db_url

    _parsed = _db_url.urlparse(DATABASE_URL)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': _parsed.path.lstrip('/') or 'postgres',
            'USER': _parsed.username or '',
            'PASSWORD': _parsed.password or '',
            'HOST': _parsed.hostname or 'localhost',
            'PORT': _parsed.port or '5432',
            'OPTIONS': {'connect_timeout': 10},
        }
    }
elif USE_SQLITE:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
            'OPTIONS': {'timeout': 20},
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('POSTGRES_DB', 'secure_vault'),
            'USER': os.environ.get('POSTGRES_USER', 'vault_user'),
            'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'vault_pass'),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),
            'OPTIONS': {'connect_timeout': 10},
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Password hashing: use bcrypt
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model
AUTH_USER_MODEL = 'accounts.User'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'EXCEPTION_HANDLER': 'utils.helpers.custom_exception_handler',
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.environ.get('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', 30))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.environ.get('JWT_REFRESH_TOKEN_LIFETIME_DAYS', 7))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'UPDATE_LAST_LOGIN': True,
}

# CORS
CORS_ALLOW_ALL_ORIGINS = False
_local_origins = 'http://localhost:3000,http://127.0.0.1:3000,http://10.13.2.53:3000,http://192.168.155.1:3000,http://192.168.9.1:3000,http://10.13.2.53:8000'
CORS_ALLOWED_ORIGINS = list(dict.fromkeys(
    (os.environ.get('CORS_ALLOWED_ORIGINS', _local_origins) + ',' + _local_origins).split(',')
))
CORS_ALLOW_CREDENTIALS = True

# ============================================================
# HTTPS / SECURE TRANSPORT (أمان نقل البيانات عبر TLS)
# ------------------------------------------------------------
# Production: set DJANGO_HTTPS=True (behind Nginx/Caddy + TLS).
# Local dev on http://localhost keeps working when unset/False.
# ============================================================
HTTPS_ENABLED = os.environ.get('DJANGO_HTTPS', 'False') == 'True'

# Reverse proxy (Nginx/Caddy) terminates TLS and forwards HTTPS.
# Without this, Django may mistakenly think requests are plain HTTP
# and reject secure cookies / redirect loops may occur.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Only send session & CSRF cookies over HTTPS.
SESSION_COOKIE_SECURE = HTTPS_ENABLED
CSRF_COOKIE_SECURE = HTTPS_ENABLED

# Hardened cookie flags: never readable by client-side JS, restricted to
# same-site requests.
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'

# Redirect all HTTP traffic to HTTPS when enabled.
SECURE_SSL_REDIRECT = HTTPS_ENABLED

# HSTS: tell browsers to only use HTTPS for this domain.
# max-age in seconds (31536000 = 1 year). Only meaningful on HTTPS.
SECURE_HSTS_SECONDS = 31536000 if HTTPS_ENABLED else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = HTTPS_ENABLED
SECURE_HSTS_PRELOAD = HTTPS_ENABLED

# Miscellaneous hardening (safe even on localhost).
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'no-referrer'
SECURE_BROWSER_XSS_FILTER = True

# Celery
CELERY_BROKER_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'
CELERY_TASK_ALWAYS_EAGER = not bool(os.environ.get('REDIS_URL'))

# Cache: local cache for SQLite dev mode, Redis for production
if USE_SQLITE:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'secure-vault-cache',
        }
    }
    SESSION_ENGINE = 'django.contrib.sessions.backends.db'
else:
    if os.environ.get('REDIS_URL'):
        CACHES = {
            'default': {
                'BACKEND': 'django_redis.cache.RedisCache',
                'LOCATION': os.environ.get('REDIS_URL', 'redis://localhost:6379/0'),
                'OPTIONS': {'CLIENT_CLASS': 'django_redis.client.DefaultClient'},
            }
        }
        SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
        SESSION_CACHE_ALIAS = 'default'
    else:
        CACHES = {
            'default': {
                'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
                'LOCATION': 'secure-vault-cache',
            }
        }
        SESSION_ENGINE = 'django.contrib.sessions.backends.db'

# Swagger
SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header'
        }
    },
    'USE_SESSION_AUTH': False,
    'JSON_EDITOR': True,
}

# Encryption
DOCUMENT_ENCRYPTION_KEY = os.environ.get('DOCUMENT_ENCRYPTION_KEY', '')

# Rate Limiting
RATE_LIMIT_LOGIN = '5/minute'
RATE_LIMIT_REGISTER = '3/hour'
RATE_LIMIT_DOCUMENT_CREATE = '20/minute'
RATE_LIMIT_DOCUMENT_LIST = '60/minute'

# Email (console backend by default for local development)
EMAIL_BACKEND = os.environ.get(
    'EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend'
)
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@securevault.com')

# Ensure log directory exists
LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} [pid:{processName}] {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': str(BASE_DIR / 'logs' / 'django.log'),
            'maxBytes': 1024 * 1024 * 5,
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
        },
        'apps': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
        },
    },
}
