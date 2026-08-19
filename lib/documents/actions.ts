"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminContext } from "@/lib/auth/guards";
import { toActionError, type ActionState } from "@/lib/errors";
import { documentSchema } from "@/lib/validations/documents";
import { createDocument, deleteDocument as deleteDocumentRecord } from "@/lib/documents/service";

function fieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return Object.fromEntries(
    error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]),
  );
}

function getRequiredFile(formData: FormData) {
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    return file;
  }

  return null;
}

function revalidateDocumentPaths(documentId?: string) {
  revalidatePath("/admin/documents");
  revalidatePath("/documents");
  revalidatePath("/admin/dashboard");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  if (documentId) {
    revalidatePath(`/admin/documents/${documentId}`);
    revalidatePath(`/documents/${documentId}`);
  }
}

export async function createDocumentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = documentSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    category: formData.get("category"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the form",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const file = getRequiredFile(formData);
  if (!file) {
    return { error: "Choose a file to upload.", fieldErrors: { file: "Choose a file to upload." } };
  }

  let documentId = "";

  try {
    const { ctx, building } = await requireAdminContext();
    const document = await createDocument(ctx, building.id, parsed.data, file);
    documentId = document.id;
  } catch (error) {
    return toActionError(error);
  }

  revalidateDocumentPaths(documentId);
  redirect(`/admin/documents/${documentId}?notice=document-uploaded`);
}

export async function deleteDocumentAction(documentId: string) {
  try {
    const { ctx } = await requireAdminContext();
    await deleteDocumentRecord(ctx, documentId);
  } catch (error) {
    return toActionError(error);
  }

  revalidateDocumentPaths();
  redirect("/admin/documents?notice=document-deleted");
}
