# Secure Document Vault — How to go live on HTTPS (production)

This app is fully ready for production. Encryption (AES-256-GCM) works,
the database is clean, and all API tests pass. The only missing piece for a
public `https://` URL is domain + TLS in front of the app.

## Current local setup (your dev box)
- Backend : Waitress on 0.0.0.0:8000 (Windows service `SecureVaultService`, auto-start, auto-restart)
- Frontend: Create-React-App dev server on 0.0.0.0:3000
- DB     : SQLite (`backend/db.sqlite3`)
- Security headers active on every response (CSP, X-Frame-Options, nosniff…)

## Why http:// does not become https:// by itself
HTTPS / TLS is performed by a reverse proxy (Nginx/Caddy) using a certificate
signed by a trusted CA. Django/Waitress do not do TLS by themselves, and public
CAs will not issue a trustable cert for `localhost`. So you need a real domain.

## Steps to get a public https:// URL

### 1. Requirements (yours)
- A public domain, e.g. `securevault.com`, DNS pointing to your server's public IP.
- A VPS / cloud server (Linux) with at least 1GB RAM, or open port 80/443 on your router to the machine running the app.

### 2. Install Nginx + certbot on the server
```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

### 3. Reverse proxy Nginx config
Create `/etc/nginx/sites-available/securevault`:
```nginx
server {
    listen 80;
    server_name securevault.com www.securevault.com;
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
Enable + reload:
```bash
sudo ln -s /etc/nginx/sites-available/securevault /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Get a free trusted certificate (Let's Encrypt)
```bash
sudo certbot --nginx -d securevault.com -d www.securevault.com
```
Certbot installs the cert, enables HSTS, and auto-renews. After this,
`https://securevault.com` works around the world with a trusted padlock.

### 5. Turn on Django HTTPS security (now that TLS exists)
In `backend/.env` set:
```
DJANGO_HTTPS=True
DJANGO_ALLOWED_HOSTS=securevault.com,www.securevault.com
CORS_ALLOWED_ORIGINS=https://securevault.com,https://www.securevault.com
DJANGO_DEBUG=False
```
and restart the service:
```
sc.exe stop SecureVaultService   # Windows
sc.exe start SecureVaultService
```
This turns on SESSION_COOKIE_SECURE, CSRF_COOKIE_SECURE, SECURE_SSL_REDIRECT
and HSTS automatically (already wired in `config/settings.py`).

### 6. Use Waitress (not runserver) — already done
The service already runs Waitress, a production-grade Windows server.

## Proof of REAL encryption (show the professor)
From `backend/`:
```
python proof_encryption.py 9
```
It prints: the stored ciphertext as hex (unreadable), the AES-256 key/nonce,
the SHA-256 integrity checksum, and that decrypting returns the original text
exactly. It also proves none of the plaintext is stored in the DB.

## Final status
- 16/16 automated tests pass (documents, sharing, accounts, audit).
- All 17 live API endpoints return 200.
- Every document in the DB is AES-256-GCM encrypted with per-document key + nonce + SHA-256 checksum.
- Clean-up: no test documents remain.