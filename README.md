# Mystery Mansion

A production-ready online murder mystery board game built with **Next.js 16**, **Socket.IO**, **PostgreSQL**, and **NextAuth**.

![Mystery Mansion](https://img.shields.io/badge/Next.js-16.2.6-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-green)

## Features

- **3–6 player online multiplayer** with real-time WebSocket gameplay
- **Server-authoritative game state** with hidden solution and private hands
- **Full Cluedo-style mechanics**: dice movement, suggestions, disproving, accusations
- **9 custom rooms**, 6 suspects, 6 weapons (original theme)
- **Authentication**: email/password signup, guest play, Google OAuth
- **Detective notes sheet** for tracking deductions
- **Reconnect support** after page refresh
- **Polished mansion-themed UI** with responsive layout
- **Unit tests** for core game rules

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Framer Motion |
| Real-time | Socket.IO |
| Auth | NextAuth v5 (Auth.js) |
| Database | PostgreSQL + Prisma ORM |
| State | Zustand |
| Tests | Vitest |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL) or a hosted Postgres instance

### 1. Clone and install

```bash
npm install
```

### 2. Set up environment (staging)

```bash
cp .env.staging.example .env
```

Edit `.env`: set `AUTH_SECRET` and optionally `NGROK_AUTHTOKEN` for public sharing.

> `APP_ENV=staging` — ngrok only runs in staging, never in production.

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Run database migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

> **Note:** The dev server uses a custom Node.js server (`server.ts`) that runs both Next.js and the Socket.IO WebSocket handler on the same port.

## Deploy (production — one app)

**Staging** = local (`npm run dev`). **Production** = one Docker app on a free host.

| Platform | Quick start |
|----------|-------------|
| **Render** | Push to GitHub → New Blueprint → uses `render.yaml` |
| **Railway** | `railway init` → add Postgres → `railway up` |
| **Fly.io** | `fly launch` → attach Postgres → `fly deploy` |
| **Docker** | `npm run docker:deploy` |

Full guide: **[DEPLOY.md](./DEPLOY.md)**

Not supported: Vercel / Netlify (no Socket.IO server).

## Public access with ngrok (staging only)

Share the game with friends while developing locally. ngrok **only runs when `APP_ENV=staging`** — production ignores it.

### 1. Add ngrok to `.env` (staging)

```env
BASE_URL=https://your-subdomain.ngrok-free.dev
NEXT_PUBLIC_BASE_URL=https://your-subdomain.ngrok-free.dev
NEXTAUTH_URL=https://your-subdomain.ngrok-free.dev

NGROK_DOMAIN=your-subdomain.ngrok-free.dev
NGROK_AUTHTOKEN=your_token_from_ngrok_dashboard
NGROK_REGION=us
```

| Variable | Purpose |
|----------|---------|
| `BASE_URL` | Public HTTPS URL for invite links and auth callbacks |
| `NEXT_PUBLIC_BASE_URL` | Same URL exposed to the browser for QR/share links |
| `NGROK_DOMAIN` | Reserved ngrok domain (from ngrok dashboard) |
| `NGROK_AUTHTOKEN` | Your ngrok authtoken — tunnel won't start without it |
| `NGROK_REGION` | Tunnel region: `us`, `eu`, `ap`, `au`, `sa`, `jp`, `in` |

### 2. Start the server

```bash
npm run dev
```

You'll see output like:

```
> Mystery Mansion ready on http://localhost:3001
> ngrok tunnel active
> Public URL:  https://your-subdomain.ngrok-free.dev
> Share this URL with friends to play online
```

### 3. Share with friends

- Send the **public URL** or lobby **QR code** — links use `BASE_URL` automatically
- Friends open `/join/ABC123` from anywhere (guest play supported)

### Google OAuth with ngrok

Add this redirect URI in Google Cloud Console:

```
https://your-subdomain.ngrok-free.dev/api/auth/callback/google
```

## Google OAuth Setup (local)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials (Web application)
3. Add authorized redirect URI: `http://localhost:3001/api/auth/callback/google`
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Socket.IO |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run unit tests |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open database GUI |

## Game Flow

1. **Sign in** — create account, sign in with Google, or play as guest
2. **Lobby** — host creates a game and shares the 6-character code
3. **Start** — host starts when 3–6 players are ready
4. **Play** — take turns rolling dice, moving, suggesting, and accusing
5. **Win** — make a correct final accusation to solve the mystery

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── api/auth/         # NextAuth + registration API
│   ├── auth/             # Login & signup pages
│   ├── game/[id]/        # Live game board
│   └── lobby/            # Game lobby
├── components/
│   ├── game/             # Board, cards, notes
│   ├── layout/           # Header
│   └── ui/               # Button, Input, Modal
├── hooks/                # useSocket
├── lib/
│   └── game/             # Game engine, board, constants
└── store/                # Zustand game store
server/
└── socket.ts             # Socket.IO event handlers
server.ts                 # Custom HTTP + WebSocket server
prisma/
└── schema.prisma         # Database models
```

## Deployment

### Frontend + Backend (monolith)

Deploy to **Railway**, **Render**, or **DigitalOcean** using the custom server:

```bash
npm run build
npm start
```

Set environment variables: `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, Google OAuth credentials.

### Database

Use **Supabase**, **Neon**, or **AWS RDS** for PostgreSQL. Run migrations:

```bash
npx prisma migrate deploy
```

### Vercel Note

Vercel serverless functions do not support persistent WebSocket connections. For Vercel deployment, host the Socket.IO server separately and point the frontend to it.

## License

MIT
