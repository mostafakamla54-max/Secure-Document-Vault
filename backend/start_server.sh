#!/bin/bash
# Render.com start command for the Django backend.
set -e

echo "== Running migrations =="
python manage.py migrate --noinput

echo "== Collecting static files =="
python manage.py collectstatic --noinput

echo "== Creating superuser if fresh DB =="
# Only create if SUPERVISOR_USERNAME/PASSWORD env are set AND a superuser doesn't exist.
if [ -n "$SUPERVISOR_USERNAME" ] && [ -n "$SUPERVISOR_PASSWORD" ]; then
  python - <<'PY'
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser(
        username=os.environ['SUPERVISOR_USERNAME'],
        password=os.environ['SUPERVISOR_PASSWORD'],
        email=os.environ.get('SUPERVISOR_EMAIL', 'admin@securevault.com'),
    )
    print('Superuser created.')
else:
    print('Superuser already exists.')
PY
fi

echo "== Starting Gunicorn =="
exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:$PORT \
  --workers ${WEB_CONCURRENCY:-2} \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -