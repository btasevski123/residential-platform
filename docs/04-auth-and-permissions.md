# Auth and permissions

## Session

1. User signs in with email + password (`lib/auth/actions.ts`).
2. Password is checked with bcrypt (`lib/auth/password.ts`).
3. A random 32-byte token is created. The database stores `sha256(AUTH_SECRET + ":" + token)`. The browser stores the raw token in an httpOnly cookie named `atrium_session`.
4. Cookie: `httpOnly`, `sameSite=lax`, `secure` in production, 30-day expiry.
5. Logout deletes the `Session` row and the cookie.

**Why hash the token?** If the database leaks, stolen hashes are not usable as cookies. **Why not JWT in localStorage?** XSS would steal it; we need server-revocable sessions.

`AUTH_SECRET` must be set. `.env.example` is for local Docker only.

## Loading the current user

`getAccessContext()` (`lib/auth/current-user.ts`):

- Reads the cookie → `Session` → `User`
- Loads organization memberships and building memberships (with building + apartment)
- Returns `null` if missing, expired, or `user.isActive === false`

Wrapped in React `cache()` per request.

## Guards

| Helper | Use |
| --- | --- |
| `requireAccessContext()` | Any authenticated page (inbox) |
| `requireResidentContext()` | Resident app; also resolves current building |
| `requireAdminContext()` | Building admin console; resolves current building |
| `requireManagerContext()` | Manager console; resolves accessible buildings |

Unauthorized users redirect to `/login`. Wrong-role users redirect to `getDefaultHomePath()` (manager → `/manager/dashboard`, admin → `/admin/dashboard`, else `/dashboard`).

## Edge vs server

`proxy.ts` redirects to login if a protected path has **no cookie**. It does not verify the session signature or role. Forged cookies still fail in `getSessionFromCookie`. Missing cookies never hit RSC.

Protected prefixes include `/dashboard`, `/admin`, `/manager`, `/notifications`, `/issues`, `/announcements`, `/api/files`, and the coming-soon resident paths.

## Permission helpers

All in `lib/permissions/index.ts`. Mental model:

| Question | Helper |
| --- | --- |
| Can this person see the building at all? | `canViewBuilding` |
| Can they operate it (publish, change issue status, see resident directory)? | `canManageBuilding` |
| Can they file an issue? | `canCreateIssue` — **residents of that building only**, not every viewer |
| Can they see this announcement? | Managers: yes. Residents: only if `publishedAt` is set and they can view the building |
| Can they see this issue? | Managers: yes. Residents: only if they are `reporterId` |
| Which app shell? | `canAccessManagerConsole` / `canAccessAdminConsole` / `canAccessResidentApp` |

Org staff (`MANAGER` or `ORG_ADMIN`) can view and manage every building in their organization. That is why a CityHome manager can open `/admin/...` for Skopje Center 12 as well as `/manager/...`.

## Default home path

Login redirects by highest console:

1. Manager console if org staff
2. Admin console if building admin
3. Resident dashboard

## File access

`/api/files/[...path]` maps to `uploads/`. The route must resolve the related issue (or future document) and call `canViewIssue` / equivalent. Path traversal is rejected in `lib/storage` (`assertSafeKey`).

## Tests

`tests/phase2.test.ts` and `tests/phase25.test.ts` hit real Postgres. They load users with `tests/helpers.ts` (`loadContext(email)`), then call **services**, not the HTTP layer. That is the right layer to lock authorization: if the service forbids it, a compromised client cannot succeed.

When you add a capability, add a test that the wrong role is rejected.
