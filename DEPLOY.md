# Deploy Mystery Mansion (one application)

Deploy **one Docker app** with **PostgreSQL**. Staging stays on your laptop with optional ngrok; production never uses ngrok.

| Platform | Config file | Free tier | Postgres |
|----------|-------------|-----------|----------|
| **Render** | `render.yaml` | ✅ Web + DB | Included in blueprint |
| **Railway** | `railway.toml` + `Dockerfile` | ✅ Limited credits | Add Postgres plugin |
| **Fly.io** | `fly.toml` + `Dockerfile` | ✅ Small VMs | `fly postgres create` |
| **Any VPS / Docker** | `docker-compose.deploy.yml` | — | Included in compose |

**Not supported:** Vercel, Netlify (no persistent Socket.IO server).

---

## What happens on deploy

1. **Docker** builds Next.js + custom server (single process)
2. **Migrations** run automatically (`prisma migrate deploy`)
3. **Public URL** auto-detected on Render / Railway / Fly if `BASE_URL` is not set
4. **`APP_ENV=production`** — ngrok disabled
5. **Health check** at `/api/ping`

### Minimum env vars (production)

| Variable | Required | Notes |
|----------|----------|-------|
| `APP_ENV` | ✅ | `production` (set in Dockerfile / configs) |
| `DATABASE_URL` | ✅ | From host Postgres addon |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `BASE_URL` | Auto* | Public HTTPS URL |
| `NEXTAUTH_URL` | Auto* | Same as BASE_URL |
| `NEXT_PUBLIC_BASE_URL` | Optional | Same URL; client falls back to `window.location.origin` |

\*Auto-detected from `RENDER_EXTERNAL_URL`, `RAILWAY_PUBLIC_DOMAIN`, or `FLY_APP_NAME`.

---

## Option 1 — Render (easiest)

### A. Push this repo to GitHub

```bash
git add render.yaml Dockerfile DEPLOY.md docker-compose.deploy.yml \
  scripts/ env/ src/app/api/ping/ src/lib/config/ \
  .dockerignore .env.production.example .env.staging.example
git commit -m "Add Render blueprint and production Docker deploy"
git push origin main
```

(Or push your whole branch if you already committed deploy files.)

### B. Create the Blueprint on Render

1. Sign in at [render.com](https://render.com) (GitHub login is easiest).
2. **Dashboard** → **New +** → **Blueprint**.
3. Connect GitHub and select **`Haleem-khan5/cluedo-game`** (or your fork).
4. Render reads **`render.yaml`** at the repo root and shows:
   - Web service **`mystery-mansion`** (Docker, free)
   - Postgres **`mystery-mansion-db`** (free)
5. Click **Apply** / **Create Blueprint** and wait for the first deploy (~5–15 min).
6. When the web service is **Live**, open its URL (e.g. `https://mystery-mansion-xxxx.onrender.com`).

`AUTH_SECRET` and `DATABASE_URL` are set by the blueprint. `BASE_URL` / `NEXTAUTH_URL` are auto-detected from `RENDER_EXTERNAL_URL` unless you set them in the dashboard.

### C. After first deploy

1. `GET https://YOUR-URL/api/ping` → `{"status":"ok",...}`
2. Guest sign-in → create lobby → invite a second browser/player
3. If auth works but sockets fail, set these on the web service (same HTTPS URL, no trailing slash):
   - `BASE_URL`
   - `NEXTAUTH_URL`
   - `NEXT_PUBLIC_BASE_URL`

> **Free web** sleeps when idle (~50s wake on first request). Fine for demos.  
> **Free Postgres** expires after **30 days**; upgrade or use Neon for long-lived data.

---

## Option 2 — Railway

```bash
npm i -g @railway/cli
railway login
railway init
```

1. Dashboard → **New** → **Database** → **PostgreSQL**
2. `railway secrets set AUTH_SECRET=$(openssl rand -base64 32)`
3. `railway up`

Railway sets `DATABASE_URL` and `RAILWAY_PUBLIC_DOMAIN` automatically.

---

## Option 3 — Fly.io

```bash
fly launch --copy-config --no-deploy
fly postgres create
fly postgres attach
fly secrets set AUTH_SECRET=$(openssl rand -base64 32)
fly deploy
```

Uses `fly.toml` — app listens on port **8080** (Fly default).

---

## Option 4 — Docker locally / VPS

```bash
cp .env.staging.example .env
# Set AUTH_SECRET in .env

npm run docker:deploy
```

Open **http://localhost:3001** — Postgres + app in one stack.

---

## Staging (local development)

```bash
cp .env.staging.example .env
npm run dev    # APP_ENV=staging, optional ngrok
```

See `.env.staging.example` for ngrok vars.

---

## Verify after deploy

1. `GET https://YOUR-URL/api/ping` → `{"status":"ok"}`
2. Guest sign-in works
3. Create lobby, share invite link
4. Second player joins — realtime works (Socket.IO)

If auth works but multiplayer fails, set `BASE_URL`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_BASE_URL` explicitly to your HTTPS URL.

---

## Build locally (same as production)

```bash
npm run build
APP_ENV=production DATABASE_URL="..." AUTH_SECRET="..." npm start
```
