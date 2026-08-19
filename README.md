# NIVIA

A digital operating platform for residential buildings. Architecture is multi-tenant from day one.

NIVIA is **not** a Viber/chat replacement. The **building** is the core entity. Residents, house councils, and management companies share one system. Access comes from memberships, never from client-supplied IDs.

**Documentation (start here):** [docs/README.md](./docs/README.md)

## Status

| Phase | What | Status |
| --- | --- | --- |
| 1 | Postgres, Prisma, sessions, tenancy, roles, seed, three consoles | Done — [docs](./docs/phases/01-foundation.md) |
| 2 | Announcements, issues, photos, history, activity, notification *writes* | Done — [docs](./docs/phases/02-announcements-and-issues.md) |
| 2.5 | Polish, dashboards, in-app inbox, mobile, empty/loading/error | Done — [docs](./docs/phases/02.5-polish-and-notifications.md) |
| 3 | Voting workflow | Done — [docs](./docs/phases/03-voting.md) |
| 4 | Documents | Done — [docs](./docs/phases/04-documents.md) |
| 5 | Email / web push on the existing inbox | Not started — [roadmap](./docs/05-roadmap.md) |

## Stack

- Next.js 16 App Router, TypeScript, Tailwind CSS v4
- PostgreSQL 16 (Docker, host port **5434**)
- Prisma 7 with `@prisma/adapter-pg`
- Zod, bcrypt sessions (`nivia_session` httpOnly cookie)

## Setup

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Full command list and demo script: [docs/07-local-operations.md](./docs/07-local-operations.md).

## Demo credentials

| Role | Email | Password | Home |
| --- | --- | --- | --- |
| Manager | `manager@cityhome.mk` | `Manager123!` | `/manager/dashboard` |
| Building admin | `admin@cityhome.mk` | `Admin123!` | `/admin/dashboard` |
| Resident | `resident@cityhome.mk` | `Resident123!` | `/dashboard` |

Organization: **CityHome Management**. Buildings: Skopje Center 12, Aerodrom 25, Karposh 8, Centar 44, Vodnjanska 18. Admin and resident are on Skopje Center 12.

## Architecture in one paragraph

`proxy.ts` only checks that a session cookie exists. Layouts call `requireResidentContext` / `requireAdminContext` / `requireManagerContext`. Services authorize with `lib/permissions` and Prisma. Forms never supply the building id; the server session does. Notifications are per-user rows; the inbox never lists another user’s alerts.

```
Organization → Building → Apartment
                 ↓
            Membership (RESIDENT | BUILDING_ADMIN)
OrganizationMembership (ORG_ADMIN | MANAGER) → all org buildings
```

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm test` | Auth and workflow tests (needs Postgres) |
| `npm run lint` | ESLint |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` | Re-seed (destructive to demo rows) |

Do not run `db:reset` unless you intend to wipe the database.
