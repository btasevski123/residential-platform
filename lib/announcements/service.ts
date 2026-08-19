import { prisma } from "@/lib/db/prisma";
import { logActivity } from "@/lib/activity";
import { notifyBuildingResidents } from "@/lib/notifications";
import { AppError } from "@/lib/errors";
import {
  canCreateAnnouncement,
  canManageBuilding,
  canViewAnnouncement,
} from "@/lib/permissions";
import { announcementSchema, type AnnouncementInput } from "@/lib/validations/announcements";
import type { AccessContext } from "@/types/auth";

async function getBuildingOrThrow(buildingId: string) {
  const building = await prisma.building.findUnique({ where: { id: buildingId } });
  if (!building) {
    throw new AppError("NOT_FOUND", "Building not found");
  }

  return building;
}

export async function listPublishedAnnouncements(ctx: AccessContext, buildingId: string) {
  const building = await getBuildingOrThrow(buildingId);
  if (!canViewAnnouncement(ctx, { publishedAt: new Date() }, building)) {
    throw new AppError("FORBIDDEN", "You cannot view announcements for this building");
  }

  return prisma.announcement.findMany({
    where: { buildingId, publishedAt: { not: null } },
    include: { author: true },
    orderBy: { publishedAt: "desc" },
  });
}

export async function listManagedAnnouncements(ctx: AccessContext, buildingId: string) {
  const building = await getBuildingOrThrow(buildingId);
  if (!canManageBuilding(ctx, building)) {
    throw new AppError("FORBIDDEN", "You cannot manage announcements for this building");
  }

  return prisma.announcement.findMany({
    where: { buildingId },
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAnnouncementForUser(ctx: AccessContext, announcementId: string) {
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
    include: { author: true, building: true },
  });

  if (!announcement) {
    throw new AppError("NOT_FOUND", "Announcement not found");
  }

  if (!canViewAnnouncement(ctx, announcement, announcement.building)) {
    throw new AppError("FORBIDDEN", "You cannot view this announcement");
  }

  return announcement;
}

export async function publishAnnouncement(
  ctx: AccessContext,
  buildingId: string,
  input: AnnouncementInput,
) {
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid announcement");
  }

  const building = await getBuildingOrThrow(buildingId);
  if (!canCreateAnnouncement(ctx, building)) {
    throw new AppError("FORBIDDEN", "You cannot publish announcements for this building");
  }

  const announcement = await prisma.announcement.create({
    data: {
      buildingId: building.id,
      authorId: ctx.user.id,
      title: parsed.data.title,
      content: parsed.data.content,
      priority: parsed.data.priority,
      publishedAt: new Date(),
    },
  });

  await logActivity({
    actorId: ctx.user.id,
    action: "ANNOUNCEMENT_PUBLISHED",
    entityType: "Announcement",
    entityId: announcement.id,
    organizationId: building.organizationId,
    buildingId: building.id,
    metadata: { title: announcement.title, priority: announcement.priority },
  });

  if (announcement.priority === "IMPORTANT" || announcement.priority === "URGENT") {
    await notifyBuildingResidents({
      buildingId: building.id,
      type: announcement.priority === "URGENT" ? "ANNOUNCEMENT_URGENT" : "ANNOUNCEMENT_IMPORTANT",
      title: announcement.title,
      body: announcement.content.slice(0, 180),
      data: { announcementId: announcement.id },
    });
  }

  return announcement;
}

export async function updateAnnouncement(
  ctx: AccessContext,
  announcementId: string,
  input: AnnouncementInput,
) {
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid announcement");
  }

  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
    include: { building: true },
  });

  if (!announcement) {
    throw new AppError("NOT_FOUND", "Announcement not found");
  }

  if (!canManageBuilding(ctx, announcement.building)) {
    throw new AppError("FORBIDDEN", "You cannot edit this announcement");
  }

  return prisma.announcement.update({
    where: { id: announcement.id },
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      priority: parsed.data.priority,
      publishedAt: announcement.publishedAt ?? new Date(),
    },
  });
}

export async function deleteAnnouncement(ctx: AccessContext, announcementId: string) {
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
    include: { building: true },
  });

  if (!announcement) {
    throw new AppError("NOT_FOUND", "Announcement not found");
  }

  if (!canManageBuilding(ctx, announcement.building)) {
    throw new AppError("FORBIDDEN", "You cannot delete this announcement");
  }

  await prisma.announcement.delete({ where: { id: announcement.id } });
  return announcement;
}
