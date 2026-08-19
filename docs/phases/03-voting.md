# Phase 3 — Voting

**Status:** done  
**Goal:** Official building decisions on the existing Vote model. No documents, payments, or a second voting system.

## Why this phase existed

Announcements and issues are the daily operating loop. Partners still need a record of **what the building decided**. The schema, unique constraint, permissions, and seed polls were already in Phase 1; this phase is the workflow.

## What shipped

- Admin creates a vote for **their** building: title, description, start, end, 2–8 options
- Residents of that building list votes (open, upcoming, closed)
- A resident casts **one** vote while the poll is `OPEN` (`VoteResponse` unique on `voteId + userId`; the choice cannot be changed)
- **Open / closed rule:** `UPCOMING` before `startsAt`, `OPEN` between `startsAt` and `endsAt` inclusive, `CLOSED` after `endsAt`
- Results (counts per option) are visible to **staff at any time** and to **residents after close**. While open, residents see turnout and their own choice, not the live tally
- Results are anonymous in the UI (no voter names). `VOTE_CAST` activity records that someone voted, not which option
- Create writes `ActivityLog` `VOTE_CREATED` and notifies building residents (`VOTE_CREATED`)
- Cast writes `ActivityLog` `VOTE_CAST`
- Coming-soon copy removed from resident home, profile, and the admin vote count

## How it is implemented

```
Create vote
  createVoteAction
    → requireAdminContext()          // building id from session
    → createVote(ctx, building.id, input)
        → canCreateVote
        → prisma.vote.create (+ options)
        → logActivity(VOTE_CREATED)
        → notifyBuildingResidents(VOTE_CREATED, data.voteId)
```

```
Cast vote
  castVoteAction
    → requireResidentContext()
    → castVote(ctx, voteId, optionId)
        → load vote + building
        → canCastVote
        → lifecycle must be OPEN
        → option must belong to this vote
        → create VoteResponse (unique voteId + userId)
        → logActivity(VOTE_CAST) without optionId in metadata
```

Building id never comes from the form. Cross-building reads use `getVoteForUser` → `canViewVote`; failure is `FORBIDDEN` and pages map that to `notFound()`.

## What was explicitly not built

- Editing or deleting a vote after create
- Changing a cast vote
- Named ballots / who voted for what
- `VOTE_CLOSING_SOON` reminders (enum exists; no worker)
- Manager portfolio voting board
- Documents, payments, email/push transport
- Issue comments, issue scope

## Key files

- `lib/validations/votes.ts`
- `lib/votes/service.ts`, `lib/votes/actions.ts`, `lib/votes/status.ts`
- `lib/permissions/index.ts` (`canViewVote`, `canViewVoteResults`)
- `app/(admin)/admin/voting/**`, `app/(resident)/voting/**`
- `components/votes/*`
- `tests/phase3.test.ts`

## How to demo it

Seed already has **Facade renovation this autumn** (open; Elena has voted) and **Intercom upgrade** (closed, with results).

1. Log in as admin → **Voting** → **Create vote** (two options, end date in the future).
2. Log in as resident → bell shows `New vote: …` → open it → cast one choice.
3. Try to vote again: rejected.
4. Admin detail shows live counts. Resident detail shows “You voted” until close, then counts.

## Why these choices

- **Results after close for residents:** a live public tally while voting is open invites bandwagoning. Staff still need turnout during the window.
- **One vote, no change:** matches `@@unique([voteId, userId])` and a paper ballot. Changing later would be a product decision, not an accident.
- **Anonymous results:** the decision is the record, not a named roll call. Activity keeps an audit that a vote happened.
- **No schema migration:** Phase 1 already had the tables. Shipping workflow on an empty model is safer than redesigning tenancy.
