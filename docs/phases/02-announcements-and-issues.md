# Phase 2 — Announcements and issues

**Status:** done  
**Goal:** The first real operating workflows on the Phase 1 model. No new product pillars (no voting, documents, payments).

## Why this phase existed

A foundation with empty “coming soon” dashboards is not demoable as an operating system. Partners need to see:

1. Official news reaching residents
2. A resident reporting a problem
3. An admin taking the issue in progress
4. A written history of that change

Those four beats are the core loop of the building.

## What shipped

### Announcements

- Admin creates/edits/deletes/publishes for **their** building
- Residents list and read **published** announcements for **their** building
- Priority `NORMAL | IMPORTANT | URGENT`
- Publishing important/urgent calls `notifyBuildingResidents`

### Issues

- Resident creates an issue (category, description, optional photo)
- Resident list is **own issues only**, filterable by status
- Admin list is **all issues in the building**; status updates allowed
- Each create writes `IssueStatusHistory` (`null → REPORTED`)
- Each status change writes **both** `IssueStatusHistory` and `ActivityLog` (`ISSUE_STATUS_CHANGED`)
- New issues notify building admins and org staff (`ISSUE_REPORTED`)

### Files

- Photos stored under `uploads/`
- Served at `/api/files/[...path]` after access check
- JPEG/PNG/WebP/GIF, 5MB max
- `lib/storage` adapter so S3 can replace disk later

### Other

- `AppError` / `ActionState` for user-safe mutation errors
- Zod schemas in `lib/validations/announcements.ts` and `issues.ts`
- Phase 2 authorization tests against live Postgres

## How it is implemented

```
Publish announcement
  createAnnouncementAction
    → requireAdminContext()          // building id from session
    → publishAnnouncement(ctx, building.id, input)
        → canCreateAnnouncement
        → prisma.announcement.create (publishedAt = now)
        → logActivity(ANNOUNCEMENT_PUBLISHED)
        → if IMPORTANT/URGENT: notifyBuildingResidents
```

```
Report issue
  createIssueAction
    → requireResidentContext()
    → createIssue(ctx, building.id, input, photo)
        → canCreateIssue              // resident of that building
        → save photo via storage adapter
        → transaction: Issue + IssueStatusHistory
        → logActivity(ISSUE_CREATED)
        → notifyBuildingAdmins
```

```
Change status
  updateIssueStatusAction
    → requireAdminContext()
    → updateIssueStatus(ctx, issueId, status)
        → load issue + building
        → canUpdateIssueStatus
        → transaction: status + history row
        → logActivity(ISSUE_STATUS_CHANGED)
        → (Phase 2.5) notify reporter with SYSTEM / ISSUE_UPDATE
```

Residents never pass `buildingId` in the form. The action uses the building from the guard.

Cross-building reads: `getAnnouncementForUser` / `getIssueForUser` load the row, then `canViewAnnouncement` / `canViewIssue`. Failure is `AppError("FORBIDDEN")`; pages map that to `notFound()` so existence is not leaked.

## What was explicitly not built

- Notification inbox / bell (model + create helpers only)
- Vote UI, document upload UI
- Scheduling announcements, email on publish
- Issue comments UI (`IssueComment` table exists unused)
- Building-wide issue board for managers (building detail already listed issues)

## Key files

- `lib/announcements/service.ts`, `lib/announcements/actions.ts`
- `lib/issues/service.ts`, `lib/issues/actions.ts`
- `lib/notifications/index.ts` (create/dispatch)
- `lib/activity/index.ts`
- `lib/storage/index.ts`
- `app/(resident)/announcements/**`, `app/(resident)/issues/**`
- `app/(admin)/admin/announcements/**`, `app/(admin)/admin/issues/**`
- `tests/phase2.test.ts`

## Why these choices

- **No schema migration in Phase 2:** the tables already existed. Shipping workflow on an empty model is safer than redesigning tenancy.
- **History + activity:** residents need a ticket timeline; managers need a building feed. One table cannot serve both well.
- **Photos on disk:** Postgres is for records; binaries belong in object storage eventually.
- **`canCreateIssue` is resident-only:** an admin should not “report as themselves” through the resident flow; they manage incoming reports.
- **Important/urgent → notify:** residents should not have to open News to learn the water is off. Inbox came in 2.5; the **write** of notification rows started here so 2.5 did not invent a second channel.
