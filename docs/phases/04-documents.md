# Phase 4 — Documents

**Status:** done  
**Goal:** A building file library on the existing Document model and local storage adapter. No payments, voting changes, or a second file system.

## Why this phase existed

Votes closed the official-decision loop. Partners still need a place for **house rules, minutes, contracts, and expense summaries** that is not a Viber attachment. The table, categories, `canViewDocuments` / `canManageDocuments`, and seed rows were already in Phase 1; this phase is upload, list, and authorized download.

## What shipped

- Admin uploads a file for **their** building: title, optional description, category, file
- Allowed types: PDF, Word, Excel, plain text, JPEG/PNG/WebP; **10MB** max
- Residents of that building list and download; staff of the building can too
- Category filter on both lists (`MEETINGS | RULES | FINANCES | MAINTENANCE | CONTRACTS | OTHER`)
- Admin can delete a document (row + stored bytes)
- Bytes live under `uploads/documents/{buildingId}/` via `lib/storage` (no image-only save)
- `/api/files/[...path]` serves a document only after `canViewDocuments` (same fail-closed pattern as issue photos)
- Create writes `ActivityLog` `DOCUMENT_UPLOADED`
- Coming-soon copy removed from resident home, profile, and the admin document count

## Open / access rule

Anyone who `canViewBuilding` can see the building’s document list. Download uses the same helper. Guessing another building’s file URL returns **not found**, not a leak.

Seed rows that still have `/demo/...` URLs (from before this phase, if the database was not re-seeded) appear in the list but are not downloadable. New uploads and a fresh seed write real files under `/api/files/...`.

## How it is implemented

```
Upload
  createDocumentAction
    → requireAdminContext()
    → createDocument(ctx, building.id, input, file)
        → canManageDocuments
        → assertDocumentFile
        → storage.save(documents/{buildingId})
        → prisma.document.create
        → logActivity(DOCUMENT_UPLOADED)
```

```
Download
  GET /api/files/...
    → session required
    → getDocumentByFileUrl (or issue photo lookup)
    → canViewDocuments / canViewIssue
    → read from uploads/
```

Building id never comes from the form. Cross-building reads use `getDocumentForUser` → `canViewDocuments`; failure is `FORBIDDEN` and pages map that to `notFound()`.

## What was explicitly not built

- Versioning, folders, or per-apartment private files
- Resident upload
- Email/push when a file is added (`NotificationType` has no document value; no new enum)
- Manager portfolio document board
- Object storage (S3); `lib/storage` remains the swap point
- Payments, voting changes, issue scope

## Key files

- `lib/validations/documents.ts`
- `lib/documents/service.ts`, `lib/documents/actions.ts`
- `lib/storage/index.ts` (`assertDocumentFile`, save no longer image-only)
- `app/api/files/[...path]/route.ts`
- `app/(admin)/admin/documents/**`, `app/(resident)/documents/**`
- `components/documents/*`
- `tests/phase4.test.ts`

## How to demo it

1. Log in as admin → **Documents** → **Upload document**.
2. Title: `Stairwell lighting quote`, category **Maintenance**, attach a small PDF or `.txt`.
3. Log in as resident → **Documents** (or home) → open the file → **Download**.
4. Admin can delete it; the resident list no longer shows it.

Seed titles after a reseed: **House rules 2026**, **Meeting minutes — July**, **Q2 shared expenses**, **Elevator service contract**.

## Why these choices

- **Reuse storage:** issue photos already proved the adapter. Documents only add MIME/size rules at the domain boundary.
- **Authorize on the row, not the path:** a UUID in the URL is not access. `canViewDocuments` is.
- **No notification enum:** a file library should not spam every resident the way an urgent announcement does. Activity is enough for the building feed.
- **No schema migration:** Phase 1 already had Document. Shipping workflow on that model is safer than redesigning files.
