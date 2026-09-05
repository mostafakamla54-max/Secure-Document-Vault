# Deploy to Render (free) — permanent https:// URL, independent of your laptop

This gives you a real `https://...onrender.com` URL anyone can open, that keeps
running even when your laptop/phone is off (free tier "sleeps" after inactivity
and wakes on first visit — fine for demos/reviews).

## What's already set up (done by me, verified locally)
- The React app now calls the API **same-origin** (`/api/v1`), so UI + API are one URL (no CORS).
- Django serves the built React app (Whitenoise) at `/` — verified: `/` = 200 SPA,
  `/static/js/*.js` = 200 real bundle, `/admin/` & `/swagger/` still 200.
- `backend/start_server.sh`: migrate + collectstatic + create superuser (if fresh) + gunicorn.
- `backend/Dockerfile`: now runs `start_server.sh` (includes the React build already).
- `render.yaml`: Blueprint with free Postgres + web service + env vars.

## The 3 steps you must do (require your Render account)

### Step 1 — Push your code to GitHub (Render needs a repo)
Commit everything in the project root (including `frontend/build` result copied into
`backend/static` and `backend/templates/index.html`), then push to a new GitHub repo.
Do **not** commit `backend/.env` (secrets) or `backend/staticfiles` (generated).

### Step 2 — Create a free Render account
Open render.com → Sign up (GitHub login is easiest, free).

### Step 3 — Blueprint deploy (one click)
1. Render dashboard → **New → Blueprint**.
2. Connect your GitHub repo.
3. Render reads `render.yaml`, creates the Postgres database + web service.
4. Click **Apply**. Render builds ~2-4 min.

When it finishes you get a URL like:
```
https://secure-vault-backend.onrender.com
```

### Superuser (created automatically by start_server.sh)
- Username: `admin`
- Password: the value Render generated for `SUPERVISOR_PASSWORD`
  (dashboard → secure-vault-backend → Environment → reveal).

## Verify
- Open `https://secure-vault-backend.onrender.com` → login page loads (the SPA).
- Log in with `admin` + the generated password.
- `https://.../admin/` → Django admin.
- `https://.../swagger/` → API docs.

## Important free-tier notes
- The service **sleeps** after ~15 min idle; first visit after sleep takes ~30s to wake.
- Postgres free tier is fine for this project.
- To disable sleep on the paid plan ($7/mo, not needed for a demo).

## Ongoing rebuilds
Render auto-deploys on push to your GitHub default branch. To change code, push and
Render rebuilds automatically.