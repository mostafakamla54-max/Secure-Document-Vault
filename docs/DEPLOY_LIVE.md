# Deploy Live — Secure Document Vault (24/7 on a server, real `https://`)

This makes the site reachable from anywhere with a permanent, trusted `https://`
URL — **independent of your laptop** (it stays up even if your laptop is off).

## What you already have (verified working)
- `docker-compose.yml` — full prod stack: PostgreSQL 15, Redis 7, backend (Gunicorn),
  Celery + Beat, frontend, and Nginx (port 80).
- Django is already Postgres-ready (`USE_SQLITE=0` + `POSTGRES_*` envs).
- Security headers, encryption (AES-256-GCM), JWT, rate-limiting all active.

## Prerequisites (yours)
1. A Linux **VPS** (any of: Hetzner, OVH, Contabo, DigitalOcean, AWS… ~$5-15/mo). Min 1GB RAM.
2. A **domain** (optional but strongly recommended; lets you get a trusted SSL).
   DNS A-record: `securevault.yourdomain.com` → your VPS public IP.

## Step 1 — Copy the project to the server
From your machine (run once to upload everything except secrets):
```bash
scp -r "Secure Document Vault" user@YOUR_VPS_IP:/srv/vault
```

## Step 2 — Install Docker on the VPS
```bash
ssh user@YOUR_VPS_IP
sudo apt update && sudo apt install -y docker.io docker-compose-plugin nginx certbot cron
sudo systemctl enable --now docker
```

## Step 3 — Create `backend/.env` on the server (secrets live here)
```bash
cd /srv/vault/backend
cat > .env << 'EOF'
DJANGO_SECRET_KEY=<a-long-random-string>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=securevault.yourdomain.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://securevault.yourdomain.com
DJANGO_HTTPS=True
USE_SQLITE=0
POSTGRES_DB=secure_vault
POSTGRES_USER=vault_user
POSTGRES_PASSWORD=<a-strong-db-password>
DB_HOST=db
DB_PORT=5432
REDIS_URL=redis://redis:6379/0
DOCUMENT_ENCRYPTION_KEY=<base64-32-bytes-matching-your-live-key>
EOF
```
- `DOCUMENT_ENCRYPTION_KEY` must match your local one so existing docs decrypt.
  Read it locally: `grep DOCUMENT_ENCRYPTION_KEY backend/.env`.
- If starting fresh on the VPS you can generate one:
  `python -c "import os,base64;print(base64.b64encode(os.urandom(32)).decode())"`.

## Step 4 — Point the frontend at the public API
Edit `frontend/src/services/api.js` line 3 so the built frontend talks to the
public origin (NOT localhost):
```js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://securevault.yourdomain.com/api/v1';
```

## Step 5 — Start the stack
```bash
cd /srv/vault
docker compose up -d --build
docker compose exec backend python manage.py migrate --noinput
docker compose exec backend python manage.py collectstatic --noinput
docker compose exec backend python manage.py createsuperuser
```
Check: `docker compose ps` → all `Up`. Backend runs on VPS:8000.

## Step 6 — Get a trusted `https://` (Let's Encrypt, free)
Place nginx in front of Docker to terminate TLS:
```bash
sudo cat > /etc/nginx/sites-available/vault << 'EOF'
server {
    listen 80;
    server_name securevault.yourdomain.com;
    location /  { proxy_pass http://127.0.0.1:8080; proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme; }
}
EOF
sudo ln -s /etc/nginx/sites-available/vault /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d securevault.yourdomain.com      # issues + auto-renews
```
Then in `docker-compose.yml` change nginx's exposed port from `"80:80"` to `"8080:80"`
so Docker nginx listens on 8080 behind host nginx. Or better: let **certbot** edit the
host nginx to serve HTTPS and proxy to the Docker containers.

Result: `https://securevault.yourdomain.com` works from anywhere, forever.

## Keeping it running 24/7
Docker services have `restart: unless-stopped` — they survive reboot, crashes, and
are independent of your laptop. For extra uptime:
```bash
(crontab -l 2>/dev/null; echo "0 3 * * * docker compose -f /srv/vault/docker-compose.yml up -d") | crontab -
```

## Verify after deploy
- `curl -I https://securevault.yourdomain.com/api/v1/landing/` → 200
- `python proof_encryption.py 9` (on server) still shows authentic ciphertext.
- Open the URL from your phone on mobile data (not same Wi-Fi) to prove external access.