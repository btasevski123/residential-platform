# Conventions

Follow these when implementing any new phase. They encode lessons from Phases 1–2.5.

## Before writing code

1. Read [Principles](./01-principles.md) and the current phase doc.
2. Inspect `prisma/schema.prisma` — reuse tables and enums.
3. Inspect `lib/permissions/index.ts` — add a helper rather than a one-off check.
4. Do not reset the database. Do not delete CityHome seed data.

## Feature shape (copy this)

```
lib/validations/{domain}.ts     Zod
lib/{domain}/service.ts         authorize + Prisma + activity + notify
lib/{domain}/actions.ts         "use server", FormData, toActionError, redirect
app/(role)/.../page.tsx         RSC, notFound on AppError
components/{domain}/            forms and display only
tests/phaseN.test.ts            forbidden cases + happy path against Postgres
docs/phases/0N-....md           what / why / not built / key files
```

## Server / client boundary

- Files that import Prisma or `cookies()` are server-only (except `lib/db/prisma.ts` for tests).
- Client components may import presentation helpers (`lib/notifications/presentation.ts`), not services.
- If you need data in a client widget, pass it as props from a server parent or call a server action.

## Forms

- `useActionState` + `pending` to disable submit
- Validate with Zod in the action **and** in the service (`safeParse`)
- Building id from `require*Context()`, never from a hidden field the user can edit
- User-facing errors via `ActionState` / `toActionError`

## Lists and dashboards

- Prefer `count` and `take` over loading whole tables
- Prefer `groupBy` when counting per building (see manager dashboard)
- Select only fields the UI needs

## Empty / loading / error

- Empty: honest copy (“No announcements yet”), never placeholders that look like records
- Loading: `loading.tsx` + `PageSkeleton` / `DashboardSkeleton`
- Error: `app/error.tsx` — no `error.message` from the server internals
- Missing or forbidden resource: `notFound()`

## Coming soon

If the nav item exists but the workflow does not:

- Keep the route
- Render `ComingSoon` / `EmptyState`
- Do not query a list and render it as if the feature works unless it does

## Git and docs

- Do not commit `.env` or `uploads/` contents
- When a phase completes, add `docs/phases/` and update `docs/README.md` and the root `README.md` status line
- Do not start the next phase in the same change set as its documentation unless asked

## Naming

- Product: **Atrium**
- Cookie: `atrium_session`
- Docker: `atrium-postgres`
- Roles: Prisma enums in `SCREAMING_SNAKE`; UI labels via `formatEnumLabel`

## Next.js 16

Read `node_modules/next/dist/docs/` when using new APIs. This app uses `proxy.ts`, not `middleware.ts`. Do not add `middleware.ts`.
