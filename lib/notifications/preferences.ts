import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import {
  notificationPreferencesSchema,
  type NotificationPreferencesInput,
} from "@/lib/validations/notifications";
import type { AccessContext } from "@/types/auth";

export async function updateNotificationPreferences(
  ctx: AccessContext,
  input: NotificationPreferencesInput,
) {
  const parsed = notificationPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid preferences");
  }

  const user = await prisma.user.update({
    where: { id: ctx.user.id },
    data: {
      emailNotificationsEnabled: parsed.data.emailNotificationsEnabled,
      pushNotificationsEnabled: parsed.data.pushNotificationsEnabled,
    },
  });

  if (!parsed.data.pushNotificationsEnabled) {
    await prisma.pushSubscription.deleteMany({ where: { userId: ctx.user.id } });
  }

  return user;
}

export async function savePushSubscription(
  ctx: AccessContext,
  input: { endpoint: string; p256dh: string; auth: string; userAgent?: string },
) {
  if (!ctx.user.pushNotificationsEnabled) {
    throw new AppError("VALIDATION", "Push notifications are turned off");
  }

  const endpoint = input.endpoint.trim();
  const p256dh = input.p256dh.trim();
  const auth = input.auth.trim();
  if (!endpoint || !p256dh || !auth) {
    throw new AppError("VALIDATION", "Invalid push subscription");
  }

  return prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: ctx.user.id,
      endpoint,
      p256dh,
      auth,
      userAgent: input.userAgent?.slice(0, 200) ?? null,
    },
    update: {
      userId: ctx.user.id,
      p256dh,
      auth,
      userAgent: input.userAgent?.slice(0, 200) ?? null,
    },
  });
}

export async function deletePushSubscription(ctx: AccessContext, endpoint: string) {
  await prisma.pushSubscription.deleteMany({
    where: { userId: ctx.user.id, endpoint },
  });
}
