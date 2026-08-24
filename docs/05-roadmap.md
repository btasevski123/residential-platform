# Roadmap

Nothing below is implemented unless a later phase doc says it is. Do not treat this file as a license to start work unprompted.

## Phase 3 — Voting

**Status:** done. See [Phase 3](./phases/03-voting.md).

## Phase 4 — Documents

**Status:** done. See [Phase 4](./phases/04-documents.md).

## Phase 5 — Email and web push

**Status:** done. See [Phase 5](./phases/05-communications.md).

## Later — Issue scope (private vs building)

**Not scheduled. Do not build this as a side effect of voting, documents, or polish.**

Today every issue is a private ticket: a resident sees only what they reported; staff see the building. `Issue.apartmentId` is the reporter’s unit, not a visibility scope. That is correct for privacy. It is not the operating model for a building.

**Product rule**

| Scope | Who sees it | Example |
| --- | --- | --- |
| Private | Reporter + staff | Radiator in apartment 24 |
| Building | All residents of that building + staff | Elevator malfunction in a common area |

Scope is an explicit choice (resident on create, staff can correct). Do not infer it from `IssueCategory`. An electrical problem in a unit is private; an elevator problem is usually building.

**Duplicate reports**

If 15 residents report the same elevator, that must become **one** canonical building issue with 15 reporters/watchers, not 15 tickets. A later reporter should join the open issue (“I have this too”) instead of opening another. Staff can merge duplicates.

**Should include when built**

- Explicit issue scope: private vs building
- Resident list: own private issues + building issues for their building
- Join / watch an open building issue
- Staff merge of duplicate reports into one issue
- Display like “Reported by 15 residents”
- Keep private issue photos and descriptions off the building feed

**Must not**

- Make all current issues public
- Treat category as scope
- Reuse `apartmentId` as the only visibility flag (it already means “reporter’s unit”)
- Expand into work orders, vendors, or SLAs in the same change

This is the step from helpdesk tickets to a building operations record. It belongs after issues stay simple, not before voting.

## Later (not scheduled)

| Area | Notes |
| --- | --- |
| House council packaging | `OrganizationType.HOUSE_COUNCIL` is already on the schema |
| Payments / accounting | New bounded context; do not overload Issue or Document |
| Marketplace | Separate from building operations |
| Native mobile | Responsive web is the current client; APIs should stay server-authorized |
| AI | Not an MVP operating concern |
| Issue scope | Private vs building issues, join/merge duplicate reports — see section above |
| Advanced maintenance | Work orders, vendors, SLAs — after issue scope stays simple |
| Manager issue board | Portfolio aggregation was deferred on purpose |
| Issue comments | `IssueComment` exists; UI does not |
| Comms leftovers | `VOTE_CLOSING_SOON` cron, `ISSUE_UPDATE` enum, per-type prefs, digest, SMS |

## Order rationale

```
Foundation (identity, tenancy)
  → Announcements + issues (daily operations)
    → Polish + inbox (demo-ready)
      → Voting (decisions)
        → Documents (archive)
          → Push/email (reach)
            → Issue scope (private vs building, merge reports)
              → Commercial modules
```

Skipping voting to build payments would leave the core building loop incomplete.
