# Self-Hosting Groupi

> **Status: Planned** — This document describes a future feature that has not been implemented yet. It serves as the design spec and implementation plan for self-hosting support. Nothing described here is available today.

A comprehensive guide to running your own Groupi instance. The goal is a quick, platform-agnostic setup where users can be up and running with a single `docker compose up`, and optionally enable extra features by providing their own API keys.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Quick Start (5 Minutes)](#quick-start-5-minutes)
- [Networking & Access](#networking--access)
- [Service Dependency Map](#service-dependency-map)
- [Setup Script & Configuration Wizard](#setup-script--configuration-wizard)
- [Docker Compose Architecture](#docker-compose-architecture)
- [Environment Variable Reference](#environment-variable-reference)
- [Feature Tiers](#feature-tiers)
- [External Service Alternatives](#external-service-alternatives)
- [Production Deployment](#production-deployment)
- [Platform-Specific Guides](#platform-specific-guides)
- [Implementation Plan](#implementation-plan)
- [Migration from Convex Cloud](#migration-from-convex-cloud)

---

## Architecture Overview

Groupi is composed of three runtime services, all containerized:

```
┌─────────────────────────────────────────────────────────┐
│                      User's Browser                     │
└───────────────────────────┬─────────────────────────────┘
                            │
               ┌────────────▼────────────┐
               │  Networking Layer       │
               │  (one of):             │
               │  • Caddy (public IP)    │
               │  • Cloudflare Tunnel    │
               │  • Tailscale Funnel     │
               │  • Direct (LAN only)    │
               └──┬──────────────┬──────┘
                  │              │
       ┌──────────▼──┐  ┌───────▼──────────┐
       │  Next.js    │  │  Convex Backend   │
       │  Frontend   │  │  (self-hosted)    │
       │  Port 3000  │  │  Port 3210/3211   │
       └─────────────┘  └───────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  SQLite (default) or  │
                    │  PostgreSQL / MySQL    │
                    └───────────────────────┘
```

### What runs in Docker

| Container            | Image                                 | Purpose                                          |
| -------------------- | ------------------------------------- | ------------------------------------------------ |
| `convex-backend`     | `ghcr.io/get-convex/convex-backend`   | Database, real-time subscriptions, auth, storage |
| `convex-dashboard`   | `ghcr.io/get-convex/convex-dashboard` | Admin dashboard for Convex                       |
| `groupi-web`         | Built from `Dockerfile`               | Next.js frontend                                 |
| `caddy` (optional)   | `caddy:2-alpine`                      | Reverse proxy with automatic HTTPS               |
| `cloudflared` (opt.) | `cloudflare/cloudflared`              | Tunnel for NAT traversal (no port forwarding)    |

### What stays the same

The self-hosted version runs the **exact same codebase** as the cloud version. Convex's open-source backend supports all free-tier features including:

- Real-time subscriptions (queries, mutations)
- Scheduled functions (cron jobs, delayed actions)
- File storage
- HTTP actions / REST API
- Better Auth component
- Presence system

---

## Quick Start (5 Minutes)

### Prerequisites

- Docker and Docker Compose v2+
- 1 GB RAM minimum, 2 GB recommended
- No domain, public IP, or port forwarding required (the setup wizard handles networking)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-org/groupi.git
cd groupi

# 2. Run the setup wizard (handles everything — networking, secrets, features)
./scripts/self-host-setup.sh

# 3. Start everything
docker compose -f docker-compose.self-host.yml up -d

# 4. Deploy Convex functions
docker compose exec convex-backend ./generate_admin_key.sh
# Copy the admin key, then:
CONVEX_SELF_HOSTED_URL=http://localhost:3210 \
CONVEX_SELF_HOSTED_ADMIN_KEY=<your-key> \
npx convex deploy

# 5. Open the URL printed by the setup wizard
```

The setup wizard asks a series of questions about networking and which optional features you want. It generates your `.env.self-host` file, picks the right compose profile, and prints the URL where your instance will be available.

---

## Networking & Access

The setup wizard handles networking automatically. You pick how people will reach your instance, and it configures the right containers and settings. No manual port forwarding, firewall rules, or DNS knowledge required for most options.

### Option 1: Cloudflare Tunnel (Recommended Default)

**Best for:** Home servers, NAS devices, machines behind NAT, anyone who doesn't want to deal with networking.

No port forwarding. No static IP. No firewall changes. Cloudflare Tunnel creates an outbound-only connection from your machine to Cloudflare's network, which proxies traffic to your Groupi instance.

**What you need:** A free Cloudflare account and a domain on Cloudflare (free plans work).

**How it works:**

1. Create a tunnel in the [Cloudflare Zero Trust dashboard](https://one.dash.cloudflare.com/) (takes 2 minutes)
2. Copy the tunnel token
3. Paste it into the setup wizard

The wizard adds a `cloudflared` container to your compose stack that handles everything:

```yaml
cloudflared:
  image: cloudflare/cloudflared:latest
  command: tunnel run
  environment:
    - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
  depends_on:
    - groupi-web
    - convex-backend
  restart: unless-stopped
```

Your instance is accessible at `groupi.yourdomain.com` (or whatever subdomain you configure in the Cloudflare dashboard). HTTPS is automatic.

**Requirements:**

- WebSocket support must be enabled for the tunnel (on by default)
- Two public hostnames in the tunnel config: one for the frontend, one for the Convex backend

### Option 2: Public Server with Caddy

**Best for:** VPS (DigitalOcean, Hetzner, Linode), cloud VMs, dedicated servers — anything with a public IP.

Caddy acts as a reverse proxy and automatically provisions TLS certificates via Let's Encrypt.

**What you need:** A server with ports 80 and 443 open, and a domain pointing to its IP.

```yaml
caddy:
  image: caddy:2-alpine
  ports:
    - '80:80'
    - '443:443'
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile
    - caddy-data:/data
  depends_on:
    - groupi-web
    - convex-backend
  restart: unless-stopped
```

Your instance is accessible at `https://yourdomain.com`. HTTPS is automatic via Let's Encrypt.

### Option 3: Tailscale Funnel

**Best for:** Personal use, sharing with a small group who are also on Tailscale, or quick testing without a domain.

Tailscale Funnel exposes a local service to the internet through Tailscale's network. No domain purchase required — you get a `*.ts.net` URL.

**What you need:** A free Tailscale account. Funnel must be enabled in your Tailscale admin console.

```bash
# After starting the compose stack, expose via Tailscale
tailscale funnel 3000
```

Your instance is accessible at `https://your-machine.tail1234.ts.net`. HTTPS is automatic.

### Option 4: LAN Only

**Best for:** Testing, development, or groups that are always on the same network (office, home).

No proxy, no tunnel, no domain. Docker binds to `0.0.0.0` and anyone on the local network can connect using the host machine's LAN IP.

**What you need:** Nothing — this is the zero-config default.

Your instance is accessible at `http://<your-lan-ip>:3000` (e.g., `http://192.168.1.50:3000`).

**Limitations:** Only works on the local network. No HTTPS (browsers may warn about insecure connections). Passkey auth requires HTTPS in most browsers, so passkeys will only work on `localhost`.

### Option 5: Bring Your Own

**Best for:** Power users who want to use their existing infrastructure.

The compose stack exposes the raw service ports. You can put whatever you want in front of them:

| Service          | Port | Protocol         |
| ---------------- | ---- | ---------------- |
| Next.js          | 3000 | HTTP             |
| Convex API       | 3210 | HTTP + WebSocket |
| Convex Actions   | 3211 | HTTP             |
| Convex Dashboard | 6791 | HTTP             |

Use this with: Nginx, Traefik, HAProxy, AWS ALB, Cloudflare Access, ngrok, bore, or anything else. The only hard requirement is **WebSocket support** for the Convex backend port — without it, real-time features won't work.

### Networking Comparison

| Option            | Port Forwarding | Domain Required | HTTPS     | Complexity | Best For              |
| ----------------- | --------------- | --------------- | --------- | ---------- | --------------------- |
| Cloudflare Tunnel | No              | Yes (free)      | Automatic | Low        | Home servers, NAT     |
| Caddy (public IP) | Yes (80, 443)   | Yes             | Automatic | Low        | VPS, cloud VMs        |
| Tailscale Funnel  | No              | No              | Automatic | Low        | Personal, small group |
| LAN Only          | No              | No              | No        | None       | Testing, local use    |
| Bring Your Own    | Varies          | Varies          | Varies    | You decide | Power users           |

---

## Service Dependency Map

Every external service falls into one of three categories:

### Required (no external account needed)

These are fully self-contained and run inside your Docker Compose stack:

| Service          | What It Does                          | Self-Hosted Via                |
| ---------------- | ------------------------------------- | ------------------------------ |
| Convex Backend   | Database, real-time, auth, scheduling | Docker container (open-source) |
| Convex Dashboard | Admin UI for database                 | Docker container (open-source) |
| Next.js Frontend | Web application                       | Docker container (built)       |
| SQLite           | Default storage for Convex            | Embedded in Convex container   |

### Optional — Provide Your Own Key

These features require an external API key. The app works without them; those features simply become unavailable or fall back to a simpler mode:

| Service              | Feature It Enables                     | Without It                                     | Env Var(s)                                   |
| -------------------- | -------------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| **SMTP / Resend**    | Email notifications, magic links       | Email auth disabled; use password/passkey only | `SMTP_HOST` or `RESEND_API_KEY`              |
| **Discord OAuth**    | "Sign in with Discord" + Discord addon | Discord sign-in hidden, addon unavailable      | `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` |
| **Google OAuth**     | "Sign in with Google" + Google Maps    | Google sign-in hidden, manual address entry    | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`   |
| **Discord Bot**      | Sync events to Discord servers         | Discord addon unavailable                      | `DISCORD_BOT_TOKEN`                          |
| **AI (Groq/OpenAI)** | Smart date expression parsing          | Falls back to chrono-node local parsing        | `GROQ_API_KEY` or `OPENAI_API_KEY`           |
| **Google Maps API**  | Location autocomplete                  | Plain text input for locations                 | `NEXT_PUBLIC_GOOGLE_API_KEY`                 |
| **Sentry**           | Error tracking                         | No error tracking (logs only)                  | `NEXT_PUBLIC_SENTRY_DSN`                     |

### Optional — Self-Hostable Alternatives

For some services, you can swap in a self-hosted alternative instead of using a cloud API:

| Cloud Service | Self-Hosted Alternative | Notes                                |
| ------------- | ----------------------- | ------------------------------------ |
| Resend        | Any SMTP server         | Postfix, Mailhog (dev), Amazon SES   |
| Groq API      | Ollama + local LLM      | Runs locally, no API key needed      |
| PostgreSQL    | Self-hosted PostgreSQL  | Instead of SQLite for Convex storage |
| Sentry        | GlitchTip (open-source) | Drop-in Sentry replacement           |

---

## Setup Script & Configuration Wizard

The setup script (`scripts/self-host-setup.sh`) provides an interactive wizard:

```
╔══════════════════════════════════════════╗
║        Groupi Self-Host Setup            ║
╚══════════════════════════════════════════╝

── Networking ─────────────────────────────
How will people access this server?
  1) Cloudflare Tunnel — no port forwarding needed (Recommended)
  2) Public server — I have a domain and public IP
  3) Tailscale Funnel — no domain needed
  4) LAN only — same network only
  5) I'll handle networking myself
> 1
  Cloudflare Tunnel token: eyJ...
  Domain (e.g., groupi.example.com): groupi.example.com
  Site URL will be: https://groupi.example.com

── Core Settings ──────────────────────────
Generating BETTER_AUTH_SECRET... done ✓
Generating PASSKEY_RP_ID... done ✓

── Email (for magic links & notifications) ──
Choose email provider:
  1) SMTP server (self-hosted or any provider)
  2) Resend API (cloud)
  3) Skip — no email features
> 1
  SMTP host: mail.example.com
  SMTP port [587]:
  SMTP user: noreply@example.com
  SMTP password: ********
  From address [Groupi <noreply@example.com>]:

── OAuth Providers (all optional) ─────────
Enable Discord sign-in? [y/N]: y
  Discord Client ID: ...
  Discord Client Secret: ...

Enable Google sign-in? [y/N]: n
  (Skipped — Google sign-in will be hidden)

── Add-ons ────────────────────────────────
Enable Discord Bot (event sync)? [y/N]: y
  Discord Bot Token: ...

── AI Features ────────────────────────────
Enable AI date parsing? [y/N]: n
  (Skipped — will use local date parser)

── Monitoring ─────────────────────────────
Enable Sentry error tracking? [y/N]: n
  (Skipped — errors logged to console)

── Database ───────────────────────────────
Database backend:
  1) SQLite (default, simplest)
  2) PostgreSQL (recommended for production)
> 1

✓ Configuration written to .env.self-host
✓ docker-compose.self-host.yml generated
✓ Networking: Cloudflare Tunnel → groupi.example.com

Run: docker compose -f docker-compose.self-host.yml up -d
Your instance will be available at: https://groupi.example.com
```

### What the script generates

1. **`.env.self-host`** — All environment variables with sensible defaults
2. **`docker-compose.self-host.yml`** — Compose file tailored to selected options
3. Auto-generated secrets (`BETTER_AUTH_SECRET`, admin keys)
4. Feature flags for disabled services (so the frontend hides unavailable UI)

---

## Docker Compose Architecture

### `docker-compose.self-host.yml`

The setup wizard generates this file with only the services you need. The core services are always included; networking and optional services are added based on your choices.

```yaml
services:
  # ── Core Services (always included) ────────────

  convex-backend:
    image: ghcr.io/get-convex/convex-backend:latest
    ports:
      - '3210:3210' # Client API
      - '3211:3211' # HTTP Actions
    volumes:
      - convex-data:/convex/data
    env_file: .env.self-host
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3210/version']
      interval: 30s
      timeout: 10s
      retries: 3

  convex-dashboard:
    image: ghcr.io/get-convex/convex-dashboard:latest
    ports:
      - '6791:6791'
    environment:
      - CONVEX_BACKEND_URL=http://convex-backend:3210
    depends_on:
      convex-backend:
        condition: service_healthy
    restart: unless-stopped

  groupi-web:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    env_file: .env.self-host
    environment:
      - NEXT_PUBLIC_CONVEX_URL=http://convex-backend:3210
    depends_on:
      convex-backend:
        condition: service_healthy
    restart: unless-stopped

  # ── Networking (one of these, chosen by setup wizard) ──

  # Option 1: Cloudflare Tunnel (default recommendation)
  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    depends_on:
      - groupi-web
      - convex-backend
    restart: unless-stopped
    profiles:
      - tunnel

  # Option 2: Caddy reverse proxy (for public IP servers)
  caddy:
    image: caddy:2-alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
    depends_on:
      - groupi-web
      - convex-backend
    restart: unless-stopped
    profiles:
      - caddy

  # Options 3-5 (Tailscale, LAN, BYO) don't need extra
  # containers — they work with just the core services.

volumes:
  convex-data:
  caddy-data:
```

The setup wizard activates the right profile automatically:

| Networking Choice     | Compose Command                                                      |
| --------------------- | -------------------------------------------------------------------- |
| Cloudflare Tunnel     | `docker compose -f docker-compose.self-host.yml --profile tunnel up` |
| Caddy (public IP)     | `docker compose -f docker-compose.self-host.yml --profile caddy up`  |
| Tailscale / LAN / BYO | `docker compose -f docker-compose.self-host.yml up`                  |

### `Dockerfile` (Next.js frontend)

```dockerfile
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

# ── Dependencies ──────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/web/package.json packages/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/web/node_modules ./packages/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .

# Build args become env vars at build time
ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_GOOGLE_API_KEY
ARG NEXT_PUBLIC_SENTRY_DSN

# Feature flags (injected at build time)
ARG NEXT_PUBLIC_FEATURE_DISCORD_AUTH=false
ARG NEXT_PUBLIC_FEATURE_GOOGLE_AUTH=false
ARG NEXT_PUBLIC_FEATURE_EMAIL_AUTH=false
ARG NEXT_PUBLIC_FEATURE_GOOGLE_MAPS=false
ARG NEXT_PUBLIC_FEATURE_AI_DATES=false
ARG NEXT_PUBLIC_FEATURE_DISCORD_ADDON=false

RUN pnpm build:web

# ── Production ────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/packages/web/.next/standalone ./
COPY --from=builder /app/packages/web/.next/static ./packages/web/.next/static
COPY --from=builder /app/packages/web/public ./packages/web/public

EXPOSE 3000
CMD ["node", "packages/web/server.js"]
```

### `Caddyfile` (automatic HTTPS)

```caddyfile
{$SITE_DOMAIN:localhost} {
    # Frontend
    handle {
        reverse_proxy groupi-web:3000
    }

    # Convex client API (WebSocket + HTTP)
    handle /api/convex/* {
        reverse_proxy convex-backend:3210
    }

    # Convex HTTP actions (auth, REST API)
    handle /api/* {
        reverse_proxy convex-backend:3211
    }
}
```

---

## Environment Variable Reference

### Core (always required)

| Variable                 | Description                               | Default / Generated     |
| ------------------------ | ----------------------------------------- | ----------------------- |
| `SITE_URL`               | Public URL of your instance               | `http://localhost:3000` |
| `BETTER_AUTH_SECRET`     | Random 32-char secret for session signing | Auto-generated          |
| `BETTER_AUTH_URL`        | Auth callback URL (same as SITE_URL)      | Same as `SITE_URL`      |
| `PASSKEY_RP_ID`          | Passkey relying party ID (domain)         | Extracted from SITE_URL |
| `PASSKEY_RP_NAME`        | Passkey display name                      | `Groupi`                |
| `NEXT_PUBLIC_CONVEX_URL` | Convex backend URL                        | `http://localhost:3210` |
| `NEXT_PUBLIC_BASE_URL`   | Frontend public URL                       | Same as `SITE_URL`      |

### Email (choose one or skip)

| Variable            | Description                  | Required When    |
| ------------------- | ---------------------------- | ---------------- |
| `RESEND_API_KEY`    | Resend API key               | Using Resend     |
| `RESEND_FROM_EMAIL` | Sender address for Resend    | Using Resend     |
| `SMTP_HOST`         | SMTP server hostname         | Using SMTP       |
| `SMTP_PORT`         | SMTP server port             | Using SMTP       |
| `SMTP_USER`         | SMTP authentication username | Using SMTP       |
| `SMTP_PASS`         | SMTP authentication password | Using SMTP       |
| `SMTP_FROM`         | Sender address for SMTP      | Using SMTP       |
| `SMTP_SECURE`       | Use TLS (`true`/`false`)     | Using SMTP       |
| `DEBUG_MAGIC_LINKS` | Log magic links to console   | Development only |

### OAuth Providers (all optional)

| Variable                       | Description                | Feature Affected      |
| ------------------------------ | -------------------------- | --------------------- |
| `DISCORD_CLIENT_ID`            | Discord OAuth app ID       | Discord sign-in       |
| `DISCORD_CLIENT_SECRET`        | Discord OAuth app secret   | Discord sign-in       |
| `GOOGLE_CLIENT_ID`             | Google OAuth client ID     | Google sign-in        |
| `GOOGLE_CLIENT_SECRET`         | Google OAuth client secret | Google sign-in        |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google client ID (browser) | Google One Tap        |
| `NEXT_PUBLIC_GOOGLE_API_KEY`   | Google Maps API key        | Location autocomplete |

### Add-ons (optional)

| Variable            | Description                  | Feature Affected              |
| ------------------- | ---------------------------- | ----------------------------- |
| `DISCORD_BOT_TOKEN` | Discord bot token            | Discord event sync addon      |
| `GROQ_API_KEY`      | Groq API key                 | AI date parsing               |
| `OPENAI_API_KEY`    | OpenAI API key (alt to Groq) | AI date parsing (alternative) |

### Monitoring (optional)

| Variable                 | Description              | Feature Affected   |
| ------------------------ | ------------------------ | ------------------ |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN               | Error tracking     |
| `SENTRY_AUTH_TOKEN`      | Sentry auth (build only) | Source map uploads |
| `SENTRY_ORG`             | Sentry organization      | Source map uploads |
| `SENTRY_PROJECT`         | Sentry project           | Source map uploads |

### Feature Flags (auto-set by setup script)

These `NEXT_PUBLIC_FEATURE_*` flags control UI visibility. The setup script sets them based on which services are configured:

| Flag                                | Controls                               |
| ----------------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_FEATURE_DISCORD_AUTH`  | Discord sign-in button visibility      |
| `NEXT_PUBLIC_FEATURE_GOOGLE_AUTH`   | Google sign-in button visibility       |
| `NEXT_PUBLIC_FEATURE_EMAIL_AUTH`    | Magic link / email sign-in visibility  |
| `NEXT_PUBLIC_FEATURE_GOOGLE_MAPS`   | Google Maps autocomplete vs text input |
| `NEXT_PUBLIC_FEATURE_AI_DATES`      | AI date parsing vs chrono-node only    |
| `NEXT_PUBLIC_FEATURE_DISCORD_ADDON` | Discord addon in addon registry        |

---

## Feature Tiers

### Tier 1 — Zero Config (works out of the box)

These features work with no external services at all:

- Event creation, editing, and deletion
- Real-time posts, replies, and discussions
- User registration (email/password + passkeys)
- RSVP and availability voting
- Date polling
- Member management and roles
- In-app notifications
- Presence and typing indicators
- Questionnaire, Bring List, and Custom add-ons
- Reminders (in-app only)
- REST API
- Profile management
- Friend system and event invites
- Muting and Do Not Disturb

### Tier 2 — Bring Your Own Key

These features activate when you provide the relevant API key:

| Feature               | Key Needed          | Setup Effort |
| --------------------- | ------------------- | ------------ |
| Magic link sign-in    | SMTP or Resend key  | 2 minutes    |
| Email notifications   | SMTP or Resend key  | 2 minutes    |
| Discord sign-in       | Discord OAuth app   | 5 minutes    |
| Google sign-in        | Google OAuth app    | 5 minutes    |
| Discord event sync    | Discord bot token   | 5 minutes    |
| Location autocomplete | Google Maps API key | 2 minutes    |
| AI date parsing       | Groq or OpenAI key  | 1 minute     |
| Error tracking        | Sentry DSN          | 2 minutes    |

### Tier 3 — Advanced Self-Host

For users who want to replace cloud services entirely:

| Cloud Service | Self-Hosted Replacement | Compose Profile |
| ------------- | ----------------------- | --------------- |
| SQLite        | PostgreSQL              | `postgres`      |
| Resend        | Mailpit (dev) / Postfix | `mailpit`       |
| Groq API      | Ollama + Llama 3        | `ollama`        |
| Sentry        | GlitchTip               | `glitchtip`     |

---

## External Service Alternatives

### Email: SMTP Instead of Resend

The codebase currently uses the Resend SDK. To support generic SMTP, an email abstraction layer is needed:

```typescript
// convex/lib/email-provider.ts
interface EmailProvider {
  send(options: { from: string; to: string; subject: string; html: string }): Promise<void>;
}

// Resend implementation (current)
class ResendProvider implements EmailProvider { ... }

// SMTP implementation (new)
class SmtpProvider implements EmailProvider { ... }

// Factory: picks provider based on environment
export function getEmailProvider(): EmailProvider | null {
  if (process.env.RESEND_API_KEY) return new ResendProvider();
  if (process.env.SMTP_HOST) return new SmtpProvider();
  return null; // No email — features degrade gracefully
}
```

### AI: Local LLM Instead of Groq

The AI date parsing in `convex/ai/actions.ts` uses the OpenAI-compatible API format. Any OpenAI-compatible endpoint works:

```
# Use Groq (cloud)
GROQ_API_KEY=gsk_...

# OR use OpenAI (cloud)
OPENAI_API_KEY=sk-...

# OR use Ollama (local, self-hosted)
AI_BASE_URL=http://ollama:11434/v1
AI_MODEL=llama3.3
AI_API_KEY=ollama  # Ollama doesn't need a real key
```

The AI integration already uses the OpenAI SDK format, so pointing it at any compatible endpoint (Ollama, vLLM, LiteLLM, etc.) works with zero code changes — only the base URL and model name change.

### Location: Text Input Instead of Google Maps

When `NEXT_PUBLIC_GOOGLE_API_KEY` is not set, the location input falls back to a plain text field. No code changes needed — the Google Maps components already check for the API key and conditionally render.

---

## Production Deployment

### Recommended Production Stack

```
┌──────────────────────────┐
│   Caddy (auto-HTTPS)     │
│   groupi.example.com     │
└──────┬──────────┬────────┘
       │          │
┌──────▼──┐  ┌───▼──────────┐
│ Next.js │  │ Convex       │
│ (3000)  │  │ Backend      │
│         │  │ (3210/3211)  │
└─────────┘  └──────┬───────┘
                    │
             ┌──────▼───────┐
             │ PostgreSQL   │
             │ (persistent) │
             └──────────────┘
```

### System Requirements

| Scale          | CPU    | RAM  | Storage | Notes                  |
| -------------- | ------ | ---- | ------- | ---------------------- |
| Personal/small | 1 core | 1 GB | 10 GB   | SQLite is fine         |
| Medium (< 100) | 2 core | 2 GB | 20 GB   | SQLite or PostgreSQL   |
| Large (100+)   | 4 core | 4 GB | 50 GB+  | PostgreSQL recommended |

### Backup Strategy

```bash
# SQLite (default) — just copy the volume
docker compose exec convex-backend cp /convex/data/convex.db /backup/

# PostgreSQL — standard pg_dump
pg_dump -h localhost -U convex groupi > backup.sql
```

### Updates

```bash
# Pull latest images
docker compose -f docker-compose.self-host.yml pull

# Restart with new images
docker compose -f docker-compose.self-host.yml up -d

# Re-deploy Convex functions if backend code changed
npx convex deploy
```

---

## Platform-Specific Guides

The setup wizard works the same everywhere — the only difference is which networking option makes sense for your platform.

### Home Server / Raspberry Pi / NAS

Use Cloudflare Tunnel (the default). No port forwarding or router configuration needed.

```bash
git clone https://github.com/your-org/groupi.git
cd groupi
./scripts/self-host-setup.sh    # Select option 1: Cloudflare Tunnel
docker compose -f docker-compose.self-host.yml --profile tunnel up -d
```

### Any VPS (DigitalOcean, Hetzner, Linode, etc.)

Use Caddy since VPS providers give you a public IP.

```bash
# SSH into your server
ssh root@your-server

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone and setup
git clone https://github.com/your-org/groupi.git
cd groupi
./scripts/self-host-setup.sh    # Select option 2: Public server
docker compose -f docker-compose.self-host.yml --profile caddy up -d
```

### Fly.io

```bash
# Deploy Convex backend
fly launch --config fly.convex.toml
fly deploy --config fly.convex.toml

# Deploy Next.js frontend
fly launch --config fly.web.toml
fly deploy --config fly.web.toml
```

### Railway

```bash
# Use the Railway template or deploy from GitHub
# Set environment variables in Railway dashboard
# Both services auto-deploy on git push
```

### AWS (ECS / EC2)

- Use ECS Fargate with the Docker Compose file
- Or EC2 instance with Docker installed
- RDS PostgreSQL for production database
- CloudFront optional for static asset CDN

### Coolify / Dokploy

These self-hosted PaaS platforms support Docker Compose natively:

1. Connect your git repository
2. Select the `docker-compose.self-host.yml` file
3. Set environment variables in the UI
4. Deploy

### Kubernetes / OpenShift

The compose file defines the service topology. For k8s deployments, map the containers to pods/deployments:

- `convex-backend` → Deployment + Service (ports 3210, 3211) + PVC for data
- `convex-dashboard` → Deployment + Service (port 6791)
- `groupi-web` → Deployment + Service (port 3000)
- Ingress controller of your choice (nginx, Traefik, etc.) for routing

A Helm chart may be provided in a future release. For now, the compose file serves as the source of truth for the service topology, and translating it to k8s manifests is straightforward.

---

## Implementation Plan

### Phase 1: Core Self-Hosting Infrastructure

**Goal:** Get the app running in Docker with zero external dependencies. Anyone can go from `git clone` to a running instance accessible by others.

1. **Create `Dockerfile`** for the Next.js frontend
   - Multi-stage build (deps → build → production)
   - Standalone output mode for minimal image size
   - Build-time injection of `NEXT_PUBLIC_*` variables

2. **Create `docker-compose.self-host.yml`**
   - Convex backend container
   - Convex dashboard container
   - Groupi web container
   - Cloudflare Tunnel container (`tunnel` profile)
   - Caddy reverse proxy (`caddy` profile)
   - Volume mounts for persistent data

3. **Create `scripts/self-host-setup.sh`**
   - Networking wizard (Cloudflare Tunnel, Caddy, Tailscale, LAN, BYO)
   - Interactive feature selection (email, OAuth, addons, AI, monitoring)
   - Auto-generates `.env.self-host` with secrets and feature flags
   - Generates `Caddyfile` if Caddy is selected
   - Prints the correct `docker compose` command with the right profile
   - Prints the URL where the instance will be available

4. **Create `Caddyfile` template**
   - Reverse proxy for frontend and Convex backend
   - WebSocket support for Convex real-time
   - Automatic HTTPS via Let's Encrypt

5. **Update `next.config.mjs`**
   - Add `output: 'standalone'` for Docker builds
   - Make Sentry wrapper conditional (skip if no DSN)

### Phase 2: Feature Flag System

**Goal:** UI adapts to available services — disabled features are hidden, not broken.

5. **Add feature flag constants**
   - Create `packages/web/lib/feature-flags.ts`
   - Read from `NEXT_PUBLIC_FEATURE_*` environment variables
   - Provide `isFeatureEnabled('discord-auth')` helper

6. **Update auth UI**
   - Conditionally render Discord sign-in button
   - Conditionally render Google sign-in / One Tap
   - Conditionally render magic link option
   - Always show email/password and passkey (zero-config)

7. **Update addon registry**
   - Skip Discord addon registration when `FEATURE_DISCORD_ADDON` is false
   - Log warning when addon is unavailable due to missing config

8. **Update location input**
   - Already conditionally renders Google Maps
   - Verify fallback text input works cleanly

9. **Update AI date parsing**
   - Already fails gracefully when no API key
   - Ensure chrono-node fallback is robust

### Phase 3: Email Abstraction

**Goal:** Support any email provider, not just Resend.

10. **Create email provider abstraction**
    - `convex/lib/email-provider.ts`
    - `ResendProvider` (existing behavior)
    - `SmtpProvider` (new, uses `nodemailer` in a Convex action)
    - Factory function selects based on env vars

11. **Update email consumers**
    - `convex/auth.ts` magic link sender
    - `convex/email.ts` notification emails
    - `convex/email.ts` verification emails

12. **Add Mailpit to Docker Compose** (development profile)
    - Catches all outgoing mail
    - Web UI at `localhost:8025` for viewing emails
    - Zero config for development

### Phase 4: AI Provider Abstraction

**Goal:** Support any OpenAI-compatible API endpoint.

13. **Generalize AI endpoint configuration**
    - `convex/ai/actions.ts` already uses OpenAI SDK format
    - Add `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY` env vars
    - Default to Groq if `GROQ_API_KEY` is set (backward compatible)
    - Support Ollama, OpenAI, Anthropic, or any compatible endpoint

14. **Add Ollama to Docker Compose** (optional profile)
    - `ollama` service with Llama 3 model
    - Auto-pull model on first start

### Phase 5: Documentation & Polish

15. **Write user-facing docs**
    - This document (you're reading it)
    - Quick-start README section
    - FAQ and troubleshooting

16. **Create GitHub Actions for Docker image builds**
    - Build and publish `groupi-web` image to GHCR
    - Tag with version and `latest`

17. **Health checks and monitoring**
    - Health endpoint in Next.js (`/api/health`)
    - Convex backend health check
    - Docker health checks in compose file

### Phase 6: Mobile Self-Hosting Support

18. **Configurable backend URL in mobile app**
    - Allow users to point the mobile app at their own instance
    - "Connect to server" screen on first launch
    - Store server URL in secure storage

---

## Migration from Convex Cloud

For existing Groupi Cloud users who want to self-host:

### Export Data

```bash
# Export from Convex Cloud
npx convex export --path ./backup/

# Import into self-hosted instance
CONVEX_SELF_HOSTED_URL=http://localhost:3210 \
CONVEX_SELF_HOSTED_ADMIN_KEY=<key> \
npx convex import --path ./backup/
```

### DNS Cutover

1. Deploy self-hosted instance and verify it works
2. Export data from cloud
3. Import into self-hosted
4. Update DNS to point to new server
5. Update `SITE_URL` in environment
6. Re-deploy Convex functions

---

## FAQ

### Do I need to set up port forwarding?

No. If you use Cloudflare Tunnel (the default recommendation) or Tailscale Funnel, no port forwarding or router configuration is needed. These create outbound connections from your machine. Only the Caddy/public server option requires ports 80/443 to be accessible.

### Can I run this without Docker?

Yes. You need:

1. Convex backend binary (download from [GitHub releases](https://github.com/get-convex/convex-backend/releases))
2. Node.js 22+ for the Next.js frontend
3. A process manager (pm2, systemd) to keep services running
4. A reverse proxy or tunnel for external access

### Do I need a domain name?

It depends on your networking choice:

- **Cloudflare Tunnel**: Yes, but any domain on a free Cloudflare plan works
- **Caddy**: Yes, needed for Let's Encrypt TLS certificates
- **Tailscale Funnel**: No — you get a `*.ts.net` URL automatically
- **LAN only**: No — access via IP address

### Does the mobile app work with self-hosted?

The mobile app needs to point to your Convex instance URL. Configure `NEXT_PUBLIC_CONVEX_URL` to your public Convex endpoint. The instance must be reachable from the phone's network (a tunnel or public URL works; LAN-only works if the phone is on the same network).

### What about WebSocket support?

Convex requires WebSocket connections for real-time features. Cloudflare Tunnel, Caddy, and Tailscale all support WebSockets by default. If you bring your own proxy, make sure WebSocket passthrough is enabled for the Convex backend port (3210).

### What about scaling?

Self-hosted Convex runs on a single machine. For most Groupi deployments (< 1000 users), this is sufficient. If you need horizontal scaling, consider Convex Cloud which handles this automatically.

### Is my data private?

Completely. In self-hosted mode, all data stays on your infrastructure. No telemetry is sent to Convex, Groupi, or any third party.

### Can I mix cloud and self-hosted services?

Yes. For example, you can self-host the Convex backend but use Resend for email and Groq for AI. Each service is independently configurable.

### Can I switch networking methods later?

Yes. Re-run the setup wizard or manually edit `.env.self-host` and change the compose profile. For example, switching from LAN to Cloudflare Tunnel is just adding the tunnel token and restarting with `--profile tunnel`.

### Can I use my own reverse proxy (Nginx, Traefik, etc.)?

Yes. Choose option 5 ("I'll handle networking myself") in the setup wizard. The core services expose their ports directly, and you route traffic however you want. The only requirement is WebSocket support on the Convex backend port.
