# Architecture

## Stack

| Piece | Choice | Why |
| --- | --- | --- |
| Next.js 16 App Router | One app for residents, admins, managers | Fast to ship; server components keep secrets and Prisma off the client |
| TypeScript | Strict | Multi-tenant IDs and roles are easy to mix up without types |
| Tailwind CSS v4 | Existing design tokens in `app/globals.css` | One visual language; do not add another UI kit |
| PostgreSQL 16 | Docker Compose, host port **5434** | Real relational tenancy; port avoids colliding with local Postgres on 5432 |
| Prisma 7 | `@prisma/adapter-pg`, client in `generated/prisma` | Schema is the contract; driver adapter is required in Prisma 7 |
| Zod | Forms and service inputs | Same rules on the action boundary and in services |
| bcrypt + httpOnly cookie | Sessions in `Session` | No JWT-in-localStorage; tokens hashed at rest |
| lucide-react | Icons (bell) | Already in the project; do not add a second icon library |

Next.js 16 uses `proxy.ts` at the project root instead of `middleware.ts`. Cookie gating lives there. Role checks still happen in server layouts and services.

## Process overview

```
Browser
  → proxy.ts (session cookie present?)
  → Route group layout (resident / admin / manager)
      → requireResidentContext | requireAdminContext | requireManagerContext
  → Page (RSC)
      → lib/*/service.ts
          → lib/permissions
          → Prisma
          → activity / notifications
```

Mutations:

```
Form (client)
  → lib/*/actions.ts  (Zod, require*Context)
  → lib/*/service.ts  (authorize again, write)
  → revalidatePath + redirect
```

## Folder map

```
app/
  (public)/          marketing + login
  (resident)/        /dashboard, /announcements, /issues, /profile, …
  (admin)/           /admin/*
  (manager)/         /manager/*
  notifications/     shared inbox for every authenticated role
  api/files/         authorized file download
components/
  layout/            AppShell, nav, user menu
  ui/                buttons, cards, empty states, drawer, toast
  announcements/     badges, forms, list items
  issues/            badges, forms, history, filters
  notifications/     bell + list
  buildings/         building cards
lib/
  auth/              session, current user, guards, login/logout
  permissions/       the only role-rule module
  db/                Prisma singleton, tenant helpers, dashboards
  announcements/     service + actions
  issues/            service + actions
  notifications/     create helpers, inbox service, presentation
  activity/          ActivityLog writer
  storage/           local disk adapter
  validations/       Zod schemas
  navigation.ts      nav items per role
prisma/
  schema.prisma
  migrations/
  seed.ts
tests/               Node test runner against live Postgres
```

## Route groups and why they exist

| Group | Guard | Why |
| --- | --- | --- |
| `(resident)` | `requireResidentContext` | User must have an active `RESIDENT` membership |
| `(admin)` | `requireAdminContext` | Building admin **or** org staff (managers can open the admin console for a building) |
| `(manager)` | `requireManagerContext` | Org `MANAGER` or `ORG_ADMIN` |
| `app/notifications` | `requireAccessContext` | Inbox is not resident-only; admins receive `ISSUE_REPORTED` too |

`proxy.ts` only checks that a session cookie exists. It does not know roles. That is intentional: edge code must not duplicate permission logic.

## Prisma client layout

- `lib/db/prisma.ts` — singleton, used by services and tests (no `server-only`)
- `lib/db/client.ts` — re-exports with `server-only` for app/RSC code

The generated client lives in `generated/prisma` (not `node_modules/.prisma`) because Prisma 7 is configured that way in `schema.prisma`.

## Request authentication object

`AccessContext` (`types/auth.ts`) is the unit of authorization:

- `user`
- `organizationMemberships`
- `memberships` (building + apartment)
- `session` (`id`, `activeBuildingId`)

`getAccessContext()` is wrapped in React `cache()` so one request does not reload the user twice.

## UI system

Tokens: stone background, forest accent (`--accent`), shared radius and borders.

Reuse `components/ui/*`. Do not introduce shadcn, MUI, or a second button component. `buttonClassName` / `ButtonLink` keep links and buttons visually identical.

## Notifications architecture (in-app)

Creation (`lib/notifications/index.ts`): `createNotification`, `notifyBuildingResidents`, `notifyBuildingAdmins`.

Inbox (`lib/notifications/service.ts`): list / unread count / mark read. Always filtered by `ctx.user.id`.

Presentation (`lib/notifications/presentation.ts`): labels and hrefs, safe to import from client components. Prisma stays out of the client bundle.

Dispatch (`lib/notifications/dispatch.ts`): after each inbox write, `dispatchNotifications(ids)` sends email (Resend) and web push (`web-push`) for the same row. Missing API keys are a no-op. Channel failure does not delete the inbox row. `dispatchPushPlaceholder` remains as an alias.

## What “good” looks like for a new domain

Example: voting (Phase 3) followed this shape.

1. Zod schema in `lib/validations/votes.ts`
2. `canCreateVote` / `canCastVote` already exist — use them
3. `lib/votes/service.ts` + `actions.ts`
4. Pages under `/admin/voting` and `/voting`
5. Tests that a resident cannot vote twice and cannot vote in another building
6. No Prisma in the form component
