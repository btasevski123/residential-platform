# Data model

Source of truth: `prisma/schema.prisma`. Migrations: `20260819080001_init`, then additive `20260819152500_notification_channels`.

The schema was designed in Phase 1 to cover later phases. Vote workflows shipped in Phase 3. Document workflows shipped in Phase 4. Email and web push shipped in Phase 5 on the same `Notification` rows.

## Tenancy

```
Organization
  type: HOUSE_COUNCIL | MANAGEMENT_COMPANY
  └── Building[]
        └── Apartment[]
        └── Membership[]     (user ↔ building, role RESIDENT | BUILDING_ADMIN)
        └── Announcement[], Issue[], Vote[], Document[], ActivityLog[], Notification?

OrganizationMembership[]     (user ↔ organization, role ORG_ADMIN | MANAGER)
```

**Why two membership tables?**

- Building membership is how a person belongs to a specific building (and optionally an apartment).
- Organization membership is how a professional manages **all** buildings in that org without a row per building.

A user can theoretically have both. Seeded demo users do not: manager is org-only, admin and resident are building-only.

## Roles

| Role | Stored on | Scope |
| --- | --- | --- |
| `RESIDENT` | `Membership` | One building; usually one apartment |
| `BUILDING_ADMIN` | `Membership` | One building; house council / on-site admin |
| `MANAGER` | `OrganizationMembership` | Every building in the org |
| `ORG_ADMIN` | `OrganizationMembership` | Same operational access as manager in the MVP; reserved for org settings later |

`HOUSE_COUNCIL` vs `MANAGEMENT_COMPANY` on Organization is a product distinction for later billing/packaging. Permissions today key off memberships, not org type.

## Operational models

### Announcement

Belongs to a building. `publishedAt` null means draft (residents must not see it). Priority `NORMAL | IMPORTANT | URGENT`. Important/urgent publish creates in-app notifications for residents.

### Issue

Belongs to a building, optional apartment, required reporter. Status: `REPORTED → IN_PROGRESS → RESOLVED → CLOSED`. Residents create; managers/admins change status. Residents may only see **their own** issues. `apartmentId` is the reporter’s unit, not a public/private flag. Shared building issues and duplicate-report merging are on the [roadmap](./05-roadmap.md), not built.

`imageUrl` stores a path served by `/api/files/...`, not the file bytes.

### IssueStatusHistory

Append-only timeline. First row is `fromStatus = null`, `toStatus = REPORTED`. Later rows record each transition and `changedById`.

This is the **product history** (“what happened to this ticket”). It is not the same as ActivityLog.

### ActivityLog

Cross-entity audit for dashboards: `ANNOUNCEMENT_PUBLISHED`, `ISSUE_CREATED`, `ISSUE_STATUS_CHANGED`, `VOTE_CREATED`, `VOTE_CAST`, `DOCUMENT_UPLOADED`, plus enums reserved for member events.

Keep both: history is for the issue page; activity is for “what happened in this building”.

### Notification

Per-user inbox row. `userId` is the owner. `buildingId` is optional context. `data` JSON holds `announcementId`, `issueId`, `voteId`, `kind`, `status`. `readAt` null means unread.

Indexes `[userId, readAt]` and `[userId, createdAt]` exist because the bell and inbox always query by user.

Types currently in the enum:

- `ANNOUNCEMENT_IMPORTANT`
- `ANNOUNCEMENT_URGENT`
- `ISSUE_REPORTED`
- `VOTE_CREATED`
- `VOTE_CLOSING_SOON`
- `SYSTEM`

Issue status updates to the reporter use `SYSTEM` plus `data.kind = "ISSUE_UPDATE"` so Phase 2.5 did not require a migration. UI labels that as “Issue update”.

`User.emailNotificationsEnabled` and `User.pushNotificationsEnabled` (default true) gate channels. They are not a per-type matrix.

### PushSubscription

One browser endpoint per device. Bound to the session user on `/api/push/subscribe`. Unique `endpoint`. This is not a second inbox.

### NotificationDelivery

Audit / outbox for `EMAIL` | `PUSH` with `PENDING` | `SENT` | `FAILED`. Unique `(notificationId, channel)` so retries do not double-send. Not shown in the UI.

### Vote / VoteOption / VoteResponse

A vote belongs to a building. `startsAt` / `endsAt` define the window: upcoming, open, or closed. Residents cast at most one response (`@@unique([voteId, userId])`). Option counts are shown to staff at any time and to residents after close. Do not drop that unique constraint.

### Document

Belongs to a building. Metadata in Postgres; bytes on disk via `lib/storage` (`fileUrl` is `/api/files/...`). Categories: `MEETINGS | RULES | FINANCES | MAINTENANCE | CONTRACTS | OTHER`. Anyone who can view the building can list/download; only staff can upload or delete.

### Session

Stores `tokenHash` (SHA-256 of `AUTH_SECRET:rawToken`), expiry, optional `activeBuildingId` for users who can see more than one building.

## IDs

String `cuid()` primary keys everywhere. Do not switch a new table to autoincrement integers unless there is a strong reason — mixing ID styles makes tenant bugs harder to see.

## What not to do

- Do not add a second “BuildingAccess” table. Memberships are the access list.
- Do not denormalize “current user’s building” onto User. Session `activeBuildingId` plus memberships is enough.
- Do not store notification unread counts on User. Count `readAt = null` for that user.
- Do not put file blobs in Postgres.
