# Product

NIVIA is a **digital operating platform for residential buildings**.

The first market is **North Macedonia**. The data model and tenancy are designed so the same product can expand to other countries later.

## What problem it solves

Residential buildings still run on Viber groups, paper notices, and informal WhatsApp threads. That does not scale for:

- Residents who need official announcements, issue tracking, votes, and documents
- House councils that need a record of what was published and decided
- Management companies that operate many buildings and need a portfolio view

NIVIA is the system of record for the **building**, not a chat replacement.

## Two sides of the same product

| Side | Who | What they need |
| --- | --- | --- |
| B2C | Residents and house councils | Home screen, news, report a problem, votes, documents |
| B2B | Management companies | Portfolio of buildings, attention (open issues), staff tools |

Both sides share one database and one permission model. A management company user and a resident are different **memberships**, not different applications.

## Central entity

The **building** is the center of the product.

Everything operational (announcements, issues, votes, documents, notifications) belongs to a building. Organizations exist so a management company can own many buildings. Apartments exist so a resident can be tied to a unit.

```
Organization (CityHome Management)
  └── Building (Skopje Center 12)
        ├── Apartment 4
        ├── Membership: Elena Trajkovska, RESIDENT
        ├── Membership: building admin
        ├── Announcements
        ├── Issues
        ├── Votes
        └── Documents
```

## Product name in the UI

The application is branded **NIVIA** (`APP_NAME` in `lib/constants.ts`), with the tagline **Connected living, simplified.** (`APP_TAGLINE`). The repository folder may still be named `residential-platform`.

## What NIVIA is not (yet, and by design)

These are later phases or out of scope for the current MVP. Do not implement them as side effects of other work:

- Native iOS / Android apps (the web app is responsive first)
- Chat / Viber replacement
- SMS, Viber, or native push (email and web push ride on the existing inbox; see [Phase 5](./phases/05-communications.md))
- Payments, accounting, or marketplace
- AI
- Advanced maintenance / work-order systems
- Private vs building issue scope, and merging duplicate resident reports into one building issue (today residents see only their own tickets)
- Building-wide issue aggregation for managers (portfolio counts exist; a full board does not)

## Demo organization

Seeded as **CityHome Management** with five Skopje buildings. See [Local operations](./07-local-operations.md).
