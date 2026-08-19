"use server";

import { revalidatePath } from "next/cache";
import { requireAccessContext } from "@/lib/auth/guards";
import { toActionError, type ActionState } from "@/lib/errors";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/notifications/service";

function refreshNotificationViews() {
  revalidatePath("/", "layout");
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");
  revalidatePath("/manager/dashboard");
}

export async function markNotificationReadAction(notificationId: string): Promise<ActionState> {
  try {
    const ctx = await requireAccessContext();
    await markNotificationRead(ctx, notificationId);
    refreshNotificationViews();
    return { error: null };
  } catch (error) {
    return toActionError(error);
  }
}

export async function markAllNotificationsReadAction(): Promise<void> {
  try {
    const ctx = await requireAccessContext();
    await markAllNotificationsRead(ctx);
    refreshNotificationViews();
  } catch (error) {
    console.error(error);
  }
}
