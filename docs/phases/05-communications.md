# Phase 5 — Email and web push

**Status:** done  
**Goal:** Reach residents when the app is closed, without a second inbox. The `Notification` row remains the source of truth.

## Why this phase existed

Phases 2–4 write inbox rows for urgent news, new votes, reported issues, and ticket status. That only helps if the user is signed in. Partners need the same events on email and the lock screen.

`dispatchPushPlaceholder` was the reserved hook. This phase replaces it with a real dispatcher.

## What shipped

- After each inbox write, `dispatchNotifications(ids)` runs
- **Email** via Resend HTTP API when `RESEND_API_KEY` and `EMAIL_FROM` are set; otherwise a no-op so local demo still works
- **Web push** via `web-push` + VAPID when keys are set; service worker at `/sw.js`
- Preferences on `User`: `emailNotificationsEnabled`, `pushNotificationsEnabled` (both default true)
- `/settings` for every signed-in role; the same toggles on the resident **More** page
- Push subscribe/unsubscribe at `/api/push/subscribe` bound to the **session user**, never a client-supplied `userId`
- `NotificationDelivery` audit (`EMAIL` | `PUSH`, `PENDING` | `SENT` | `FAILED`) — not a UI list
- Gone push endpoints (404/410) delete the stored subscription
- Failed transport does **not** delete the inbox row

Same send policy as the inbox: important/urgent announcements, `VOTE_CREATED`, `ISSUE_REPORTED`, reporter status updates. Documents still do not notify. `VOTE_CLOSING_SOON` is still unused (needs a cron).

## How it is implemented

```
notifyBuildingResidents / notifyBuildingAdmins / createNotification
  → prisma.notification.createManyAndReturn (or create)
  → dispatchNotifications(ids)
      → skip channel if user pref is off
      → email adapter (Resend or skip)
      → push adapter (web-push per PushSubscription)
      → NotificationDelivery SENT | FAILED, or no row if skipped
```

Href in email/push is `APP_URL` + the same `notificationHref` the inbox uses (`getViewerKind` from memberships).

Local without keys: inbox and bell behave as in 2.5. Dispatch is a no-op.

## What was explicitly not built

- SMS, Viber, native FCM
- `VOTE_CLOSING_SOON` scheduler
- `ISSUE_UPDATE` enum (still `SYSTEM` + JSON)
- Per-type preference matrix, daily digest
- Document-upload notifications
- Redis / Inngest / Bull queue
- Magic login links in email

## Key files

- `prisma/schema.prisma`, `prisma/migrations/20260819152500_notification_channels/`
- `lib/notifications/index.ts`, `dispatch.ts`, `email.ts`, `push.ts`, `preferences.ts`, `config.ts`
- `app/api/push/subscribe/route.ts`, `public/sw.js`
- `app/settings/page.tsx`, `components/notifications/push-registrar.tsx`
- `tests/phase5.test.ts`

## How to demo it

1. Without Resend/VAPID: publish an urgent announcement — inbox still fills.
2. Settings → turn **Email** off for the resident → create a vote → inbox yes, no `NotificationDelivery` EMAIL row for that user.
3. With `RESEND_API_KEY` set: same vote produces a real email with an Open in NIVIA link.
4. With VAPID keys: Settings → enable push → allow the browser → create an urgent announcement → lock-screen notification.

## Why these choices

- **One inbox:** channels are delivery, not a second product.
- **Skip when unconfigured:** local Docker must not require SMTP.
- **Prefs on User:** two booleans beat a per-type matrix for the first ship.
- **In-request dispatch:** CityHome buildings are small; a worker is a later ops problem, not an MVP one.
