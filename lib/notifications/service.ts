import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import type { AccessContext } from "@/types/auth";
import type { NotificationRecord } from "@/lib/notifications/presentation";

export type { NotificationRecord } from "@/lib/notifications/presentation";
export {
  notificationHref,
  notificationTypeLabel,
  issueStatusNotificationTitle,
} from "@/lib/notifications/presentation";

export async function listMyNotifications(
  ctx: AccessContext,
  options: { take?: number } = {},
): Promise<NotificationRecord[]> {
  return prisma.notification.findMany({
    where: { userId: ctx.user.id },
    orderBy: { createdAt: "desc" },
    take: options.take,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      data: true,
      readAt: true,
      createdAt: true,
      buildingId: true,
    },
  });
}

export async function countUnreadNotifications(ctx: AccessContext) {
  return prisma.notification.count({
    where: { userId: ctx.user.id, readAt: null },
  });
}

export async function getShellNotifications(ctx: AccessContext) {
  const [unreadCount, preview] = await Promise.all([
    countUnreadNotifications(ctx),
    listMyNotifications(ctx, { take: 6 }),
  ]);

  return { unreadCount, preview };
}

export async function markNotificationRead(ctx: AccessContext, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId: ctx.user.id },
  });

  if (!notification) {
    throw new AppError("NOT_FOUND", "Notification not found");
  }

  if (notification.readAt) {
    return notification;
  }

  return prisma.notification.update({
    where: { id: notification.id },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(ctx: AccessContext) {
  return prisma.notification.updateMany({
    where: { userId: ctx.user.id, readAt: null },
    data: { readAt: new Date() },
  });
}
