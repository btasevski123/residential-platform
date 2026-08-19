# Roadmap

Nothing below is implemented unless a later phase doc says it is. Do not treat this file as a license to start work unprompted.

## Phase 3 (next) — Voting

**Why next:** The schema, unique vote constraint, permissions (`canCreateVote`, `canCastVote`), and seed polls already exist. It is the missing official decision tool after news and issues.

**Should include**

- Admin creates a vote with options, start, and end
- Resident casts **one** vote (`VoteResponse` unique on `voteId + userId`)
- Results after close (or a clear “open / closed” rule documented when built)
- Activity: `VOTE_CREATED`, `VOTE_CAST`
- Optional: `VOTE_CREATED` notifications (type already on `NotificationType`)

**Must not expand into:** documents, payments, or a second voting system.

## Phase 4 — Documents

**Why after voting:** Files are slower (storage, MIME, access). The `Document` model and local storage adapter already point the way.

**Should include**

- Admin upload for a building
- Resident list/download with `canViewDocuments`
- Categories already on the enum
- Reuse `lib/storage` (extend beyond images)

## Phase 5 — Richer communications

- Optional `ISSUE_UPDATE` enum if JSON `kind` becomes awkward
- Email or web push **on top of** the existing Notification rows (`dispatchPushPlaceholder`)
- Do not create a second notification table

## Later (not scheduled)

| Area | Notes |
| --- | --- |
| House council packaging | `OrganizationType.HOUSE_COUNCIL` is already on the schema |
| Payments / accounting | New bounded context; do not overload Issue or Document |
| Marketplace | Separate from building operations |
| Native mobile | Responsive web is the current client; APIs should stay server-authorized |
| AI | Not an MVP operating concern |
| Advanced maintenance | Work orders, vendors, SLAs — after issues stay simple |
| Manager issue board | Portfolio aggregation was deferred on purpose |
| Issue comments | `IssueComment` exists; UI does not |

## Order rationale

```
Foundation (identity, tenancy)
  → Announcements + issues (daily operations)
    → Polish + inbox (demo-ready)
      → Voting (decisions)
        → Documents (archive)
          → Push/email (reach)
            → Commercial modules
```

Skipping voting to build payments would leave the core building loop incomplete.
