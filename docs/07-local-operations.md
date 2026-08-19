# Local operations

## Requirements

- Node.js 20+
- Docker

## First-time setup

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
npm run dev
```

Open http://localhost:3000.

`DATABASE_URL` must use port **5434**. `AUTH_SECRET` in `.env.example` is for local use only.

Issue photos land in `uploads/` (gitignored). They are not stored in Postgres.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | `tests/*.test.ts` against live Postgres |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | Apply migrations |
| `npm run db:seed` | **Wipes operational seed tables and recreates CityHome** |
| `npm run db:reset` | Drop DB, migrate, generate, seed — destructive |
| `npm run db:studio` | Prisma Studio |

Do not seed or reset as part of feature work unless you intend to replace demo data.

## Demo accounts

| Role | Email | Password | Home |
| --- | --- | --- | --- |
| Manager | `manager@cityhome.mk` | `Manager123!` | `/manager/dashboard` |
| Building admin | `admin@cityhome.mk` | `Admin123!` | `/admin/dashboard` |
| Resident | `resident@cityhome.mk` | `Resident123!` | `/dashboard` |

Organization: **CityHome Management**

Buildings: Skopje Center 12, Aerodrom 25, Karposh 8, Centar 44, Vodnjanska 18

Admin and resident belong to **Skopje Center 12** (resident apartment **4**).

## Demo script (after Phase 4)

### A — Management company

1. Log in as manager.
2. Portfolio shows five buildings and open-issue totals.
3. Open **Skopje Center 12**.
4. Confirm residents, issues, activity.

### B — Announcement

1. Log in as admin.
2. Create announcement:
   - Title: `Water supply interruption`
   - Content: `Water supply will be interrupted tomorrow from 09:00 to 13:00.`
   - Priority: **URGENT**
3. Publish.

### C — Resident sees news + bell

1. Log in as resident.
2. Home shows the urgent announcement.
3. Bell shows an unread count.
4. Open the notification; it becomes read.
5. Open announcement detail.

### D — Report issue

1. Resident: **Report a problem**
2. Title: `Elevator not working`
3. Category: **ELEVATOR**
4. Description: `The elevator is not responding.`
5. Submit. Status is **Reported**.

### E — Admin triage

1. Log in as admin → **Issues**.
2. Open the elevator issue.
3. Status **Reported → In Progress**.

### F — Resident follow-up

1. Log in as resident.
2. Inbox: `Your issue is now in progress.`
3. My issues: elevator is **In Progress**.

### G — Voting

1. Log in as admin → **Voting** → **Create vote**.
2. Title: `Stairwell lighting`
3. Two options, end date next week. Create.
4. Log in as resident. Inbox: `New vote: Stairwell lighting`.
5. Open the vote and cast one option.
6. Try again: already voted.
7. Admin detail shows live counts. Resident sees their choice until the vote closes, then the tally.

Seed also has **Facade renovation this autumn** (open; Elena already voted) and **Intercom upgrade** (closed, with results).

### H — Documents

1. Log in as admin → **Documents** → **Upload document**.
2. Title: `Stairwell lighting quote`
3. Category: **Maintenance**
4. Attach a small `.txt` or PDF. Upload.
5. Log in as resident → **Documents** → open the file → **Download**.
6. Admin can delete it; it disappears from the resident list.

Seed also has **House rules 2026** and related files. If those rows still point at `/demo/...`, they list but do not download until you upload a new copy or re-seed.

## Tests

Tests use the seeded users and create temporary announcements/issues/notifications, then delete those rows in `after()`. They need Docker Postgres running.

```bash
docker compose up -d
npm test
```

## Known local pitfalls

- Another Postgres already bound to 5432 is fine; this project uses **5434**.
- `npm run db:seed` deletes notifications, issues, etc., then reseeds — demo work in the DB will vanish.
- Phase 2 tests that were interrupted before cleanup can leave extra `ISSUE_REPORTED` notifications on admin/manager. They are real rows, not UI mocks.
