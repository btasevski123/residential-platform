import { prisma } from "@/lib/db/prisma";
import { logActivity } from "@/lib/activity";
import { createNotification, notifyBuildingAdmins } from "@/lib/notifications";
import { issueStatusNotificationTitle } from "@/lib/notifications/presentation";
import { AppError } from "@/lib/errors";
import {
  canCreateIssue,
  canUpdateIssueStatus,
  canViewIssue,
  canManageIssues,
} from "@/lib/permissions";
import { fileKeyFromUrl, storage, assertImageFile } from "@/lib/storage";
import { issueSchema, issueStatusSchema, type IssueInput } from "@/lib/validations/issues";
import type { IssueStatus } from "@/generated/prisma/enums";
import type { AccessContext } from "@/types/auth";

async function getBuildingOrThrow(buildingId: string) {
  const building = await prisma.building.findUnique({ where: { id: buildingId } });
  if (!building) {
    throw new AppError("NOT_FOUND", "Building not found");
  }

  return building;
}

export async function listResidentIssues(
  ctx: AccessContext,
  buildingId: string,
  status?: IssueStatus,
) {
  const building = await getBuildingOrThrow(buildingId);
  if (!canCreateIssue(ctx, building) && !canManageIssues(ctx, building)) {
    throw new AppError("FORBIDDEN", "You cannot view issues for this building");
  }

  return prisma.issue.findMany({
    where: {
      buildingId,
      reporterId: ctx.user.id,
      ...(status ? { status } : {}),
    },
    include: { apartment: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function listManagedIssues(
  ctx: AccessContext,
  buildingId: string,
  status?: IssueStatus,
) {
  const building = await getBuildingOrThrow(buildingId);
  if (!canManageIssues(ctx, building)) {
    throw new AppError("FORBIDDEN", "You cannot manage issues for this building");
  }

  const issues = await prisma.issue.findMany({
    where: {
      buildingId,
      ...(status ? { status } : {}),
    },
    include: {
      reporter: true,
      apartment: true,
      building: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (status) {
    return issues;
  }

  const rank: Record<IssueStatus, number> = {
    REPORTED: 0,
    IN_PROGRESS: 1,
    RESOLVED: 2,
    CLOSED: 3,
  };

  return issues.sort((left, right) => {
    const byStatus = rank[left.status] - rank[right.status];
    if (byStatus !== 0) {
      return byStatus;
    }
    return right.createdAt.getTime() - left.createdAt.getTime();
  });
}

export async function getIssueForUser(ctx: AccessContext, issueId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      reporter: true,
      apartment: true,
      building: true,
      statusHistory: {
        include: { changedBy: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!issue) {
    throw new AppError("NOT_FOUND", "Issue not found");
  }

  if (!canViewIssue(ctx, issue, issue.building)) {
    throw new AppError("FORBIDDEN", "You cannot view this issue");
  }

  return issue;
}

export async function createIssue(
  ctx: AccessContext,
  buildingId: string,
  input: IssueInput,
  photo?: File | null,
) {
  const parsed = issueSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid issue");
  }

  const building = await getBuildingOrThrow(buildingId);
  if (!canCreateIssue(ctx, building)) {
    throw new AppError("FORBIDDEN", "You cannot report issues for this building");
  }

  const membership = ctx.memberships.find(
    (item) => item.buildingId === building.id && item.isActive,
  );

  let storedImageUrl: string | null = null;
  let storedKey: string | null = null;

  if (photo && photo.size > 0) {
    assertImageFile(photo);
    const stored = await storage.save(photo, `issues/${building.id}`);
    storedImageUrl = stored.url;
    storedKey = stored.key;
  }

  try {
    const issue = await prisma.$transaction(async (tx) => {
      const created = await tx.issue.create({
        data: {
          buildingId: building.id,
          apartmentId: membership?.apartmentId ?? null,
          reporterId: ctx.user.id,
          title: parsed.data.title,
          description: parsed.data.description,
          category: parsed.data.category,
          imageUrl: storedImageUrl,
          status: "REPORTED",
        },
      });

      await tx.issueStatusHistory.create({
        data: {
          issueId: created.id,
          fromStatus: null,
          toStatus: "REPORTED",
          changedById: ctx.user.id,
        },
      });

      return created;
    });

    await logActivity({
      actorId: ctx.user.id,
      action: "ISSUE_CREATED",
      entityType: "Issue",
      entityId: issue.id,
      organizationId: building.organizationId,
      buildingId: building.id,
      metadata: { title: issue.title, category: issue.category },
    });

    await notifyBuildingAdmins({
      buildingId: building.id,
      organizationId: building.organizationId,
      type: "ISSUE_REPORTED",
      title: `New issue: ${issue.title}`,
      body: issue.description.slice(0, 180),
      data: { issueId: issue.id },
    });

    return issue;
  } catch (error) {
    if (storedKey) {
      await storage.delete(storedKey);
    }
    throw error;
  }
}

export async function updateIssueStatus(ctx: AccessContext, issueId: string, status: IssueStatus) {
  const parsed = issueStatusSchema.safeParse({ status });
  if (!parsed.success) {
    throw new AppError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid status");
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { building: true },
  });

  if (!issue) {
    throw new AppError("NOT_FOUND", "Issue not found");
  }

  if (!canUpdateIssueStatus(ctx, issue.building)) {
    throw new AppError("FORBIDDEN", "You cannot update this issue");
  }

  if (issue.status === parsed.data.status) {
    return issue;
  }

  const previousStatus = issue.status;

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.issue.update({
      where: { id: issue.id },
      data: { status: parsed.data.status },
    });

    await tx.issueStatusHistory.create({
      data: {
        issueId: issue.id,
        fromStatus: previousStatus,
        toStatus: parsed.data.status,
        changedById: ctx.user.id,
      },
    });

    return next;
  });

  await logActivity({
    actorId: ctx.user.id,
    action: "ISSUE_STATUS_CHANGED",
    entityType: "Issue",
    entityId: issue.id,
    organizationId: issue.building.organizationId,
    buildingId: issue.buildingId,
    metadata: {
      title: issue.title,
      fromStatus: previousStatus,
      toStatus: parsed.data.status,
    },
  });

  if (issue.reporterId !== ctx.user.id) {
    await createNotification({
      userId: issue.reporterId,
      buildingId: issue.buildingId,
      type: "SYSTEM",
      title: issueStatusNotificationTitle(parsed.data.status),
      body: issue.title,
      data: {
        issueId: issue.id,
        kind: "ISSUE_UPDATE",
        status: parsed.data.status,
      },
    });
  }

  return updated;
}

export async function getIssueByImageUrl(ctx: AccessContext, imageUrl: string) {
  const issue = await prisma.issue.findFirst({
    where: { imageUrl },
    include: { building: true },
  });

  if (!issue || !canViewIssue(ctx, issue, issue.building)) {
    return null;
  }

  return issue;
}

export function storedImageKey(imageUrl: string) {
  return fileKeyFromUrl(imageUrl);
}
