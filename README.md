# Zed CRM - Production Ready (Twenty Fork)

Zed is Twenty CRM rebranded for your agency. Push this repo to GitHub → import in **Daytona** → teammates login with **Gmail SSO** and manage leads, calls, emails.

> Base: `twentycrm/twenty:latest` + `postgres:16` + `redis` + Zed branding. No code build needed.

## 1. Quick Start (Local)

```bash
git clone https://github.com/YOUR_ORG/zed.git
cd zed
cp .env.example .env
# edit .env -> set SERVER_URL, ENCRYPTION_KEY (already generated in repo), PG password
docker compose up -d
# wait ~60s for healthy
docker compose ps
# open http://localhost:3000 → Create account → Workspace: Zed
```

Check: `curl http://localhost:3000/healthz` → `{"status":"ok"}`

## 2. Deploy to Daytona (Production for Team)

Daytona = fast sandbox with Docker Compose + public preview URL. Use for team production if you need Daytona; otherwise same repo runs on any VPS (Hetzner/Railway).

**A. Push to GitHub:**
```bash
git init
git add .
git commit -m "Zed CRM production"
git branch -M main
git remote add origin https://github.com/YOUR_ORG/zed.git
git push -u origin main
```

**B. Import in Daytona:**
1.  Go to `app.daytona.io` → `Create` → `Import from GitHub` → select `zed`
2.  Daytona auto-detects `docker-compose.yml` (supports Docker in Docker). If not, choose `Docker Compose` template.
3.  In Daytona terminal:
    ```bash
    docker compose up -d
    ```
4.  **Expose port:** Daytona `Ports` tab → `3000` → `Public` → copy URL like `https://abcd-3000.preview.daytona.io`
5.  **Set SERVER_URL:** Update `.env`:
    ```bash
    SERVER_URL=https://abcd-3000.preview.daytona.io
    # Or run helper:
    ./scripts/setup-gmail.sh <ID> <SECRET> https://abcd-3000.preview.daytona.io
    ```
    Then `docker compose up -d` again.

> Daytona sandboxes are pay-as-you-go (`$0.0162/GiB/h`). Keep sandbox `Running` for 24/7 CRM or use `daytona sandbox set-autostop 0`. For persistent prod, deploy same repo on Hetzner `$7/mo` via `bash scripts/install.sh` equivalent.

## 3. Enable Gmail Login (Each teammate uses Gmail)

**Google Cloud (once, 5 min):**
1.  https://console.cloud.google.com → New Project `Zed` → Enable APIs: `Gmail API`, `People API`, `Calendar API` (APIs & Services → Library)
2.  `OAuth consent screen` → External → App name `Zed`, support email, scopes `openid, email, profile` → Add test users (your teammates Gmail) if in Testing mode. Publish to Production to allow any Gmail.
3.  `Credentials` → `Create Credentials → OAuth Client ID` → Type `Web application` → 
    - `Authorized redirect URIs`:
      ```
      https://YOUR_SERVER_URL/auth/google/callback
      https://YOUR_SERVER_URL/auth/google-apis/callback
      ```
      For Daytona: `https://abcd-3000.preview.daytona.io/auth/google/callback` (replace with your actual preview URL)
      For local: `http://localhost:3000/auth/google/callback`
4.  Copy `Client ID` + `Client Secret`.

**Configure Zed:**
```bash
./scripts/setup-gmail.sh 123456789-abc.apps.googleusercontent.com GOCSPX-xxx https://abcd-3000.preview.daytona.io
# or manually edit .env:
# AUTH_GOOGLE_CLIENT_ID=...
# AUTH_GOOGLE_CLIENT_SECRET=...
# AUTH_GOOGLE_CALLBACK_URL=https://.../auth/google/callback
# AUTH_GOOGLE_APIS_CALLBACK_URL=https://.../auth/google-apis/callback
# MESSAGING_PROVIDER_GMAIL_ENABLED=true
# CALENDAR_PROVIDER_GOOGLE_ENABLED=true
docker compose restart
```

Teammates now: `https://your-url` → `Continue with Google` → Gmail → auto-create account in Zed workspace. First user is admin.

**Admin Panel (after login):** `Settings → Admin Panel → Configuration Variables` shows Gmail status without restarting; DB-backed config syncs in 15s (`setup.mdx`).

## 4. Agency Workflow (Leads → Assign → Call/Mail)

1.  **Import leads:** `Settings → Data Model → People → Import CSV` (Name, Email, Phone, Company). Also `Opportunities` for deals pipeline.
2.  **Assign:** Table → select leads → `Bulk Edit → Owner = teammate`. Or `Workflows → New → Trigger: People Created → Action: Assign Owner (round-robin)`.
3.  **Views for team:** Create `View: My Leads` → `Filter: Owner = Current User`. Each member sees only his leads.
4.  **Calling:** Add `Phone` field → click to call. Create `Task` of type `Call` per lead. Timeline tracks calls.
5.  **Mailing (Gmail sync):** Once Google connected, `Settings → Accounts → Connect Gmail` → syncs emails to `Emails` timeline. Workflows can `Send Email` via Gmail.

## 5. Production Checklist

- [ ] `SERVER_URL` = public HTTPS (required for Google & secure cookies). No `http://localhost` in prod.
- [ ] `ENCRYPTION_KEY` + `PG_DATABASE_PASSWORD` strong + backed up (loss = lost OAuth tokens/TOTP)
- [ ] `STORAGE_TYPE=local` OK for Daytona volumes, use `S_3` for scale.
- [ ] Backups: `docker exec zed-db-1 pg_dump -U postgres default > backup.sql` (cron daily)
- [ ] Upgrade: `TAG=latest docker compose pull && docker compose up -d` (check upgrade guide).

## 6. Files

- `docker-compose.yml` - Zed stack (server/worker/db/redis) with branding patch
- `.env` - generated secrets (do NOT commit to public repo - Daytona injects via env vars)
- `branding/patch-branding.sh` - renames Twenty → Zed at runtime (`dist/front/index.html:31`)
- `scripts/setup-gmail.sh` - one-command Gmail OAuth setup
- `.daytona.json` - Daytona workspace config

Need help with Gmail OAuth or first CSV import? Open an issue.
