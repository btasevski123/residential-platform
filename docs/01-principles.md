# Principles

These rules apply to every phase. Later features must fit them. They exist because a multi-tenant residential platform fails first on **authorization mistakes** and **fake data**, not on missing screens.

## 1. Never trust tenant IDs from the client

Do not take `userId`, `organizationId`, `buildingId`, `createdBy`, or `reporterId` from forms, query strings, or JSON bodies as the source of truth.

Always:

1. Load the session (`getAccessContext()`).
2. Resolve memberships from the database.
3. Pass a server-derived building id into services.
4. Run `lib/permissions` helpers against that context.

Hiding a link in the UI is not security. Route groups and navigation only shape UX.

## 2. One permission module

All role rules live in `lib/permissions/index.ts`.

Do not copy `if (role === "RESIDENT")` into pages, components, or a second helper file. If a new capability is needed (for example `canCastVote`), add it there and call it from the service layer.

## 3. Business logic stays out of UI

| Layer | Responsibility |
| --- | --- |
| `app/**/page.tsx` | Load context, call a service, render |
| `lib/*/actions.ts` | `"use server"`: parse FormData, Zod, call service, revalidate, redirect |
| `lib/*/service.ts` | Authorization, Prisma writes, activity, notifications |
| `components/**` | Presentation, forms, pending UI |

Pages must not contain Prisma queries for writes. Components must not decide whether a user may publish an announcement.

## 4. Real PostgreSQL data only

Dashboards, lists, and badges must come from the database.

- Seed data belongs in `prisma/seed.ts`.
- Do not hardcode residents, issues, or counts in React.
- If a feature is not built, show an intentional empty / coming-soon state. Do not invent a fake vote or document list.

## 5. Multi-tenant from day one

There is no “single building mode” that later becomes multi-tenant. Every operational row has a `buildingId` (notifications may also be user-global). Organization staff see every building in their org; building roles see only their building.

## 6. Additive schema, careful migrations

The Phase 1 schema already includes Vote, Document, Notification, and ActivityLog so later phases do not require a redesign.

- Prefer reusing enums and JSON `data` payloads over new tables.
- Do not reset the database to “make a demo work”.
- Do not delete seeded CityHome data as part of feature work.

## 7. Fail closed

If a resource is missing or the user is not allowed to see it, return **not found** to the browser. Do not leak that another building’s announcement exists. Log technical detail on the server. Never send stack traces or Prisma errors to the UI.

## 8. Local storage is an adapter

Issue photos are files on disk (`uploads/`), not bytea in Postgres. `lib/storage` is the swap point for object storage later. File URLs are served only after `canViewIssue` (or the equivalent) succeeds.

## 9. Phase boundaries are real

A polish phase must not become a feature phase. A voting phase must not become payments. If work is listed as “do not implement”, leave it as coming soon.
