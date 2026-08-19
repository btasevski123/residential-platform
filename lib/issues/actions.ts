"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminContext, requireResidentContext } from "@/lib/auth/guards";
import { toActionError, type ActionState } from "@/lib/errors";
import { issueSchema, issueStatusSchema } from "@/lib/validations/issues";
import { createIssue, updateIssueStatus } from "@/lib/issues/service";
import type { IssueStatus } from "@/generated/prisma/enums";

function fieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return Object.fromEntries(
    error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]),
  );
}

function getOptionalPhoto(formData: FormData) {
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    return photo;
  }

  return null;
}

export async function createIssueAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = issueSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the form",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  try {
    const { ctx, building } = await requireResidentContext();
    await createIssue(ctx, building.id, parsed.data, getOptionalPhoto(formData));
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/issues");
  revalidatePath("/admin/issues");
  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  redirect("/issues?notice=reported");
}

export async function updateIssueStatusAction(
  issueId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = issueStatusSchema.safeParse({
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Choose a valid status" };
  }

  try {
    const { ctx } = await requireAdminContext();
    await updateIssueStatus(ctx, issueId, parsed.data.status as IssueStatus);
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath("/admin/issues");
  revalidatePath(`/admin/issues/${issueId}`);
  revalidatePath("/issues");
  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  redirect(`/admin/issues/${issueId}?notice=status`);
}
