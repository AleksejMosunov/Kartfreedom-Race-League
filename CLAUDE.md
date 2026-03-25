# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Next.js with webpack)
npm run build    # Production build
npm run start    # Run production server
npm run lint     # Run ESLint
```

No test framework is configured. There is no `test` script.

## Architecture

**Go-Kart Championship Management Platform** — Next.js 16 full-stack app with:
- Public-facing pages: championship standings, pilot profiles, stage results, registration, calendar
- Admin panel (`/admin/*`): tournament/stage/pilot/team management, audit logs, metrics
- REST API routes (`/app/api/`) for all data operations
- MongoDB via Mongoose for persistence
- Zustand stores for client-side state with TTL caching and request deduplication
- Telegram bot integration for league notifications

### Key layers

| Layer | Location | Purpose |
|-------|----------|---------|
| Pages / UI | `app/` | Next.js App Router, SSR with `force-dynamic` |
| API routes | `app/api/*/route.ts` | RESTful endpoints |
| Business logic | `lib/utils/`, `lib/championship/` | Scoring, standings calculation |
| Data models | `lib/models/` | 9 Mongoose schemas |
| State stores | `store/` | 4 Zustand stores |
| Auth / Security | `lib/auth.ts`, `lib/security/` | HMAC-SHA256 sessions, scrypt passwords, CSRF |
| Types | `types/` | Shared TypeScript interfaces |

### Authentication & Authorization

- Custom cookie-based sessions signed with HMAC-SHA256 (`ADMIN_SESSION_SECRET`)
- CSRF protection: token in cookie + `x-csrf-token` request header
- Three admin roles: `organizer` > `marshal` > `editor`
- All admin actions logged to `AuditLog` collection with before/after state
- Bootstrap admin created via `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars on first run

### Data models

`Championship`, `Pilot`, `Team`, `Stage`, `SprintGroup`, `AdminUser`, `AuditLog`, `LeagueSettings`

### Environment variables

```bash
MONGODB_URI                      # Required
ADMIN_SESSION_SECRET             # Required
ADMIN_USERNAME / ADMIN_PASSWORD  # Bootstrap admin (optional after first run)
TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID  # Optional notifications
NEXT_PUBLIC_SPONSOR_CONTACT_URL  # Optional
NEXT_PUBLIC_SENTRY_DSN / SENTRY_ORG / SENTRY_PROJECT  # Optional error tracking
```

### Deployment

Docker multi-stage build with `output: standalone`. See `DEPLOY.md` for Docker Compose + Nginx + GitHub Actions setup.

### Documentation

Detailed reference docs live in `/docs/`: `ARCHITECTURE.md`, `APIs.md`, `USAGE.md`, `EXAMPLES.md`.
