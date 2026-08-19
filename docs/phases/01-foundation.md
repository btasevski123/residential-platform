# Phase 1 — Foundation

**Status:** done  
**Goal:** A real multi-tenant product shell, not a mockup.

## Why this phase existed

Before announcements or issues, the platform needed:

- A database that already understood organizations, buildings, apartments, and roles
- Authentication that could not be bypassed by posting another building’s id
- Three working surfaces: resident, building admin, management company
- Demo data that looks like a Skopje portfolio

Without that, every later feature would invent its own tenancy.

## What shipped

- Next.js App Router app branded **NIVIA**
- Docker PostgreSQL 16 on host port **5434**
- Prisma schema for the full MVP domain (including Vote/Document/Notification tables used later)
- Migration `20260819080001_init`
- bcrypt passwords + hashed session cookies
- `AccessContext` + `lib/permissions`
- Tenant helpers (`lib/db/tenant.ts`)
- Seed: CityHome Management, five buildings, demo users, sample announcements/issues/votes/documents/activity
- Route groups `(public)`, `(resident)`, `(admin)`, `(manager)`
- Live dashboards reading Postgres (not hardcoded cards)
- PWA manifest placeholder (`app/manifest.ts`)

## How it is implemented

### Database

`docker-compose.yml` runs `nivia-postgres`. `DATABASE_URL` points at `localhost:5434`. Prisma 7 uses `prisma.config.ts` plus `@prisma/adapter-pg`.

### Auth

See [Auth and permissions](../04-auth-and-permissions.md). Login action chooses the home path from roles.

### Dashboards (Phase 1 shape)

`lib/db/dashboards.ts` loaded counts and recent rows per role. Those queries were refined in Phase 2.5; the principle stayed: RSC pages call dashboard functions, they do not query in a `useEffect`.

### Seed

`prisma/seed.ts` is idempotent in the sense that it **clears operational rows then recreates** CityHome. That is why feature work must not run `db:reset` casually — it wipes demo and test leftovers by design of the seed script.

Demo passwords (local only):

| Email | Password | Role |
| --- | --- | --- |
| `manager@cityhome.mk` | `Manager123!` | Manager |
| `admin@cityhome.mk` | `Admin123!` | Building admin, Skopje Center 12 |
| `resident@cityhome.mk` | `Resident123!` | Resident, apartment 4, Skopje Center 12 |

Other apartments get generated residents (`firstname.lastname.{unit}.{building-slug}@cityhome.mk`).

## What was explicitly not built

- Announcement compose UI (schema only)
- Issue report UI (schema only)
- Notification inbox
- Voting / documents UI
- Email

## Key files

- `prisma/schema.prisma`, `prisma/seed.ts`
- `lib/auth/*`, `lib/permissions/index.ts`, `lib/db/*`
- `app/(resident)/layout.tsx`, `app/(admin)/layout.tsx`, `app/(manager)/layout.tsx`
- `proxy.ts`

## Why these choices

- **Port 5434:** developers often already have Postgres on 5432.
- **Schema ahead of UI:** Vote unique constraint and Notification indexes are cheaper to add before anyone depends on a wrong shape.
- **Three route groups:** different nav and guards without one mega-layout full of `if (role)`.
- **Permissions module:** the product will grow; scattered `role ===` checks will miss an endpoint.
