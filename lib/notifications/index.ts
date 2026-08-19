import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { NotificationType } from "@/generated/prisma/enums";

export type NotificationPayload = {
  userId: string;
  buildingId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
};

export async function createNotification(payload: NotificationPayload) {
  return prisma.notification.create({
    data: {
      userId: payload.userId,
      buildingId: payload.buildingId ?? null,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    },
  });
}

export async function createNotifications(payloads: NotificationPayload[]) {
  if (payloads.length === 0) {
    return { count: 0 };
  }

  return prisma.notification.createMany({
    data: payloads.map((payload) => ({
      userId: payload.userId,
      buildingId: payload.buildingId ?? null,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    })),
  });
}

export async function notifyBuildingResidents(input: {
  buildingId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
  excludeUserId?: string;
}) {
  const residents = await prisma.membership.findMany({
    where: {
      buildingId: input.buildingId,
      role: "RESIDENT",
      isActive: true,
      ...(input.excludeUserId ? { userId: { not: input.excludeUserId } } : {}),
    },
    select: { userId: true },
  });

  return createNotifications(
    residents.map((resident) => ({
      userId: resident.userId,
      buildingId: input.buildingId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data,
    })),
  );
}

export async function notifyBuildingAdmins(input: {
  buildingId: string;
  organizationId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
}) {
  const [admins, orgStaff] = await Promise.all([
    prisma.membership.findMany({
      where: {
        buildingId: input.buildingId,
        role: "BUILDING_ADMIN",
        isActive: true,
      },
      select: { userId: true },
    }),
    prisma.organizationMembership.findMany({
      where: {
        organizationId: input.organizationId,
        isActive: true,
      },
      select: { userId: true },
    }),
  ]);

  const userIds = [...new Set([...admins, ...orgStaff].map((item) => item.userId))];

  return createNotifications(
    userIds.map((userId) => ({
      userId,
      buildingId: input.buildingId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data,
    })),
  );
}

// Web push will attach here later without changing callers.
export async function dispatchPushPlaceholder(notificationIds: string[]) {
  return { queued: notificationIds.length };
}
