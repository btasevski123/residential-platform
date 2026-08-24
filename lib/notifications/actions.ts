"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccessContext } from "@/lib/auth/guards";
import { toActionError, type ActionState } from "@/lib/errors";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/notifications/service";
import { updateNotificationPreferences } from "@/lib/notifications/preferences";
import { notificationPreferencesSchema } from "@/lib/validations/notifications";

function refreshNotificationViews() {
  revalidatePath("/", "layout");
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");
  revalidatePath("/manager/dashboard");
  revalidatePath("/settings");
  revalidatePath("/profile");
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

function formToggle(formData: FormData, name: string) {
  return formData.getAll(name).map(String).includes("true");
}

export async function updateNotificationPreferencesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = notificationPreferencesSchema.safeParse({
    emailNotificationsEnabled: formToggle(formData, "emailNotificationsEnabled"),
    pushNotificationsEnabled: formToggle(formData, "pushNotificationsEnabled"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form" };
  }

  try {
    const ctx = await requireAccessContext();
    await updateNotificationPreferences(ctx, parsed.data);
  } catch (error) {
    return toActionError(error);
  }

  refreshNotificationViews();
  const returnTo = formData.get("returnTo") === "/profile" ? "/profile" : "/settings";
  redirect(`${returnTo}?notice=prefs-saved`);
}

