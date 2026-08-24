import { prisma } from "@/lib/db/prisma";
import { APP_NAME, getAppUrl } from "@/lib/constants";
import { getViewerKind } from "@/lib/navigation";
import { notificationHref, notificationTypeLabel } from "@/lib/notifications/presentation";
import { sendNotificationEmail } from "@/lib/notifications/email";
import { sendNotificationPush } from "@/lib/notifications/push";
import type { AccessContext } from "@/types/auth";

const DISPATCH_CONCURRENCY = 8;

export async function dispatchNotifications(notificationIds: string[]) {
  const uniqueIds = [...new Set(notificationIds)].filter(Boolean);
  if (uniqueIds.length === 0) {
    return { queued: 0 };
  }

  const notifications = await loadNotifications(uniqueIds);
  await mapWithConcurrency(notifications, DISPATCH_CONCURRENCY, dispatchOne);
  return { queued: notifications.length };
}

async function dispatchOne(
  notification: Awaited<ReturnType<typeof loadNotifications>>[number],
) {
  const user = notification.user;
  if (!user.isActive) {
    return;
  }

  const ctx = contextForUser(notification);
  const viewer = getViewerKind(ctx);
  const path = notificationHref(notification, viewer);
  const url = `${getAppUrl()}${path}`;
  const subject = `${notificationTypeLabel(notification)} · ${APP_NAME}`;

  if (user.emailNotificationsEnabled && user.email) {
    await deliver(notification.id, "EMAIL", async () => {
      const result = await sendNotificationEmail({
        to: user.email,
        subject,
        title: notification.title,
        body: notification.body,
        url,
      });
      return result.skipped ? "skipped" : "sent";
    });
  }

  if (user.pushNotificationsEnabled && user.pushSubscriptions.length > 0) {
    await deliver(notification.id, "PUSH", async () => {
      const result = await sendNotificationPush(user.pushSubscriptions, {
        title: notification.title,
        body: notification.body,
        url,
      });
      return result.skipped ? "skipped" : "sent";
    });
  }
}

function loadNotifications(ids: string[]) {
  return prisma.notification.findMany({
    where: { id: { in: ids } },
    include: {
      user: {
        include: {
          organizationMemberships: true,
          memberships: { include: { building: true, apartment: true } },
          pushSubscriptions: true,
        },
      },
    },
  });
}

function contextForUser(
  notification: Awaited<ReturnType<typeof loadNotifications>>[number],
): AccessContext {
  return {
    user: notification.user,
    organizationMemberships: notification.user.organizationMemberships,
    memberships: notification.user.memberships,
    session: { id: "dispatch", activeBuildingId: null },
  };
}

async function deliver(
  notificationId: string,
  channel: "EMAIL" | "PUSH",
  send: () => Promise<"sent" | "skipped">,
) {
  const existing = await prisma.notificationDelivery.findUnique({
    where: { notificationId_channel: { notificationId, channel } },
  });
  if (existing?.status === "SENT") {
    return;
  }

  const row =
    existing ??
    (await prisma.notificationDelivery.create({
      data: { notificationId, channel, status: "PENDING" },
    }));

  try {
    const result = await send();
    if (result === "skipped") {
      await prisma.notificationDelivery.delete({ where: { id: row.id } }).catch(() => undefined);
      return;
    }

    await prisma.notificationDelivery.update({
      where: { id: row.id },
      data: { status: "SENT", error: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Delivery failed";
    await prisma.notificationDelivery.update({
      where: { id: row.id },
      data: { status: "FAILED", error: message },
    });
  }
}

async function mapWithConcurrency<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  const workerCount = Math.min(limit, Math.max(queue.length, 0));
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (item) {
          await fn(item);
        }
      }
    }),
  );
}
