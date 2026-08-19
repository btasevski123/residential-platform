import { prisma } from "@/lib/db/prisma";
import { logActivity } from "@/lib/activity";
import { AppError } from "@/lib/errors";
import { canManageDocuments, canViewDocuments } from "@/lib/permissions";
import { assertDocumentFile, fileKeyFromUrl, isStoredFileUrl, storage } from "@/lib/storage";
import { documentSchema, type DocumentInput } from "@/lib/validations/documents";
import type { DocumentCategory } from "@/generated/prisma/enums";
import type { AccessContext } from "@/types/auth";

async function getBuildingOrThrow(buildingId: string) {
  const building = await prisma.building.findUnique({ where: { id: buildingId } });
  if (!building) {
    throw new AppError("NOT_FOUND", "Building not found");
  }

  return building;
}

export async function listDocumentsForBuilding(
  ctx: AccessContext,
  buildingId: string,
  category?: DocumentCategory,
) {
  const building = await getBuildingOrThrow(buildingId);
  if (!canViewDocuments(ctx, building)) {
    throw new AppError("FORBIDDEN", "You cannot view documents for this building");
  }

  return prisma.document.findMany({
    where: { buildingId, ...(category ? { category } : {}) },
    include: { uploadedBy: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDocumentForUser(ctx: AccessContext, documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { uploadedBy: true, building: true },
  });

  if (!document) {
    throw new AppError("NOT_FOUND", "Document not found");
  }

  if (!canViewDocuments(ctx, document.building)) {
    throw new AppError("FORBIDDEN", "You cannot view this document");
  }

  return {
    ...document,
    downloadable: isStoredFileUrl(document.fileUrl),
  };
}

export async function getDocumentByFileUrl(ctx: AccessContext, fileUrl: string) {
  const document = await prisma.document.findFirst({
    where: { fileUrl },
    include: { building: true },
  });

  if (!document || !canViewDocuments(ctx, document.building)) {
    return null;
  }

  return document;
}

export async function createDocument(
  ctx: AccessContext,
  buildingId: string,
  input: DocumentInput,
  file: File,
) {
  const parsed = documentSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid document");
  }

  const building = await getBuildingOrThrow(buildingId);
  if (!canManageDocuments(ctx, building)) {
    throw new AppError("FORBIDDEN", "You cannot upload documents for this building");
  }

  assertDocumentFile(file);
  const stored = await storage.save(file, `documents/${building.id}`);

  try {
    const document = await prisma.document.create({
      data: {
        buildingId: building.id,
        uploadedById: ctx.user.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        category: parsed.data.category,
        fileUrl: stored.url,
        fileName: stored.fileName,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
      },
    });

    await logActivity({
      actorId: ctx.user.id,
      action: "DOCUMENT_UPLOADED",
      entityType: "Document",
      entityId: document.id,
      organizationId: building.organizationId,
      buildingId: building.id,
      metadata: { title: document.title, category: document.category },
    });

    return document;
  } catch (error) {
    await storage.delete(stored.key);
    throw error;
  }
}

export async function deleteDocument(ctx: AccessContext, documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { building: true },
  });

  if (!document) {
    throw new AppError("NOT_FOUND", "Document not found");
  }

  if (!canManageDocuments(ctx, document.building)) {
    throw new AppError("FORBIDDEN", "You cannot delete this document");
  }

  await prisma.document.delete({ where: { id: document.id } });

  if (isStoredFileUrl(document.fileUrl)) {
    await storage.delete(fileKeyFromUrl(document.fileUrl));
  }

  return document;
}
