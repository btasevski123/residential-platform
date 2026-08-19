"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminContext, requireResidentContext } from "@/lib/auth/guards";
import { toActionError, type ActionState } from "@/lib/errors";
import { createVoteSchema, castVoteSchema } from "@/lib/validations/votes";
import { createVote, castVote as castVoteRecord } from "@/lib/votes/service";

function fieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return Object.fromEntries(
    error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]),
  );
}

function parseCreateVote(formData: FormData) {
  const options = formData
    .getAll("options")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  return createVoteSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    options,
  });
}

function revalidateVotePaths(voteId?: string) {
  revalidatePath("/admin/voting");
  revalidatePath("/voting");
  revalidatePath("/admin/dashboard");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  if (voteId) {
    revalidatePath(`/admin/voting/${voteId}`);
    revalidatePath(`/voting/${voteId}`);
  }
}

export async function createVoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseCreateVote(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the form",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  let voteId = "";

  try {
    const { ctx, building } = await requireAdminContext();
    const vote = await createVote(ctx, building.id, parsed.data);
    voteId = vote.id;
  } catch (error) {
    return toActionError(error);
  }

  revalidateVotePaths(voteId);
  redirect(`/admin/voting/${voteId}?notice=vote-created`);
}

export async function castVoteAction(
  voteId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = castVoteSchema.safeParse({
    optionId: formData.get("optionId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Choose an option" };
  }

  try {
    const { ctx } = await requireResidentContext();
    await castVoteRecord(ctx, voteId, parsed.data.optionId);
  } catch (error) {
    return toActionError(error);
  }

  revalidateVotePaths(voteId);
  redirect(`/voting/${voteId}?notice=voted`);
}
