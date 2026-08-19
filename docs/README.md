# NIVIA documentation

This folder is the source of truth for **how the platform is built and why**.

Read it before adding features. NIVIA is intended to become a large multi-tenant product. Short-term shortcuts that duplicate auth, invent a second data model, or put business rules in React components will become expensive.

## Start here

| Document | What it answers |
| --- | --- |
| [Product](./00-product.md) | What NIVIA is, who it is for, what it is not |
| [Principles](./01-principles.md) | Rules that do not change between phases |
| [Architecture](./02-architecture.md) | Stack, folders, request flow |
| [Data model](./03-data-model.md) | Prisma schema and tenancy |
| [Auth and permissions](./04-auth-and-permissions.md) | Sessions, roles, server-side authorization |

## Phases (implemented)

| Document | Status |
| --- | --- |
| [Phase 1 — Foundation](./phases/01-foundation.md) | Done |
| [Phase 2 — Announcements and issues](./phases/02-announcements-and-issues.md) | Done |
| [Phase 2.5 — Product polish and notification inbox](./phases/02.5-polish-and-notifications.md) | Done |
| [Phase 3 — Voting](./phases/03-voting.md) | Done |
| [Phase 4 — Documents](./phases/04-documents.md) | Done |

## Next

| Document | Status |
| --- | --- |
| [Roadmap](./05-roadmap.md) | Phase 5+ planned |
| [Conventions](./06-conventions.md) | How to add a feature without breaking the platform |
| [Local operations](./07-local-operations.md) | Setup, demo accounts, commands, tests |

## How to use this as the platform grows

1. When a phase ships, add a new file under `docs/phases/` with **what shipped**, **why**, **key files**, **what was explicitly not built**, and **how to demo it**.
2. Update the architecture / data-model docs only when the system actually changed.
3. Do not document planned work as if it already exists.
4. Keep demo data in PostgreSQL (`prisma/seed.ts`). Never invent business data inside React components.
