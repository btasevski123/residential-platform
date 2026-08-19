"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminContext } from "@/lib/auth/guards";
import { toActionError, type ActionState } from "@/lib/errors";
import { announcementSchema } from "@/lib/validations/announcements";
import {
  deleteAnnouncement as deleteAnnouncementRecord,
  publishAnnouncement,
  updateAnnouncement as updateAnnouncementRecord,
} from "@/lib/announcements/service";

function parseAnnouncement(formData: FormData) {
  return announcementSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    priority: formData.get("priority"),
  });
}

function fieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return Object.fromEntries(
    error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]),
  );
}

export async function createAnnouncementAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseAnnouncement(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the form",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  try {
    const { ctx, building } = await requireAdminContext();
    await publishAnnouncement(ctx, building.id, parsed.data);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  revalidatePath("/admin/dashboard");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  redirect("/admin/announcements?notice=published");
}

export async function updateAnnouncementAction(
  announcementId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseAnnouncement(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the form",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  try {
    const { ctx } = await requireAdminContext();
    await updateAnnouncementRecord(ctx, announcementId, parsed.data);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/announcements");
  revalidatePath(`/admin/announcements/${announcementId}`);
  revalidatePath("/announcements");
  revalidatePath(`/announcements/${announcementId}`);
  redirect(`/admin/announcements/${announcementId}?notice=saved`);
}

export async function deleteAnnouncementAction(announcementId: string) {
  try {
    const { ctx } = await requireAdminContext();
    await deleteAnnouncementRecord(ctx, announcementId);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  redirect("/admin/announcements?notice=deleted");
}
