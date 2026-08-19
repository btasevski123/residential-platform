# Data model

Source of truth: `prisma/schema.prisma`. One migration so far: `prisma/migrations/20260819080001_init`.

The schema was designed in Phase 1 to cover later phases. Vote and Document tables exist and are seeded. Their **workflows are not implemented**.

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

Belongs to a building, optional apartment, required reporter. Status: `REPORTED → IN_PROGRESS → RESOLVED → CLOSED`. Residents create; managers/admins change status. Residents may only see **their own** issues.

`imageUrl` stores a path served by `/api/files/...`, not the file bytes.

### IssueStatusHistory

Append-only timeline. First row is `fromStatus = null`, `toStatus = REPORTED`. Later rows record each transition and `changedById`.

This is the **product history** (“what happened to this ticket”). It is not the same as ActivityLog.

### ActivityLog

Cross-entity audit for dashboards: `ANNOUNCEMENT_PUBLISHED`, `ISSUE_CREATED`, `ISSUE_STATUS_CHANGED`, plus enums reserved for vote/document/member events.

Keep both: history is for the issue page; activity is for “what happened in this building”.

### Notification

Per-user inbox row. `userId` is the owner. `buildingId` is optional context. `data` JSON holds `announcementId`, `issueId`, `kind`, `status`. `readAt` null means unread.

Indexes `[userId, readAt]` and `[userId, createdAt]` exist because the bell and inbox always query by user.

Types currently in the enum:

- `ANNOUNCEMENT_IMPORTANT`
- `ANNOUNCEMENT_URGENT`
- `ISSUE_REPORTED`
- `VOTE_CREATED`
- `VOTE_CLOSING_SOON`
- `SYSTEM`

Issue status updates to the reporter use `SYSTEM` plus `data.kind = "ISSUE_UPDATE"` so Phase 2.5 did not require a migration. UI labels that as “Issue update”.

### Vote / VoteOption / VoteResponse

Ready for Phase 3. `VoteResponse` has `@@unique([voteId, userId])` so a resident cannot vote twice. Do not change that when building the UI.

### Document

Ready for the documents phase. Metadata in Postgres; file bytes should follow the storage adapter pattern (not the database).

### Session

Stores `tokenHash` (SHA-256 of `AUTH_SECRET:rawToken`), expiry, optional `activeBuildingId` for users who can see more than one building.

## IDs

String `cuid()` primary keys everywhere. Do not switch a new table to autoincrement integers unless there is a strong reason — mixing ID styles makes tenant bugs harder to see.

## What not to do

- Do not add a second “BuildingAccess” table. Memberships are the access list.
- Do not denormalize “current user’s building” onto User. Session `activeBuildingId` plus memberships is enough.
- Do not store notification unread counts on User. Count `readAt = null` for that user.
- Do not put file blobs in Postgres.
