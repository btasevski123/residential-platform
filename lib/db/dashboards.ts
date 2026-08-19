import "server-only";

import { prisma } from "@/lib/db/client";
import { canManageBuilding, canViewBuilding, canViewResidents } from "@/lib/permissions";
import { getAccessibleBuildings } from "@/lib/db/tenant";
import type { AccessContext } from "@/types/auth";

function countByBuilding(
  rows: { buildingId: string; _count: { _all: number } }[],
) {
  return Object.fromEntries(rows.map((row) => [row.buildingId, row._count._all]));
}

export async function getResidentDashboard(ctx: AccessContext, buildingId: string) {
  const building = await prisma.building.findUnique({ where: { id: buildingId } });
  if (!building || !canViewBuilding(ctx, building)) {
    return null;
  }

  const membership = ctx.memberships.find((item) => item.buildingId === buildingId);

  const now = new Date();

  const [featuredAnnouncements, recentIssues, notifications, openVotes] = await Promise.all([
    prisma.announcement.findMany({
      where: {
        buildingId,
        publishedAt: { not: null },
        priority: { in: ["IMPORTANT", "URGENT"] },
      },
      orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
      take: 1,
      include: { author: true },
    }),
    prisma.issue.findMany({
      where: { buildingId, reporterId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.notification.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.vote.findMany({
      where: { buildingId, startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { endsAt: "asc" },
      take: 2,
      include: {
        _count: { select: { responses: true } },
        responses: { where: { userId: ctx.user.id }, take: 1, select: { id: true } },
      },
    }),
  ]);

  return {
    building,
    apartment: membership?.apartment ?? null,
    featuredAnnouncement: featuredAnnouncements[0] ?? null,
    recentIssues,
    notifications,
    openVotes,
  };
}

export async function getAdminDashboard(ctx: AccessContext, buildingId: string) {
  const building = await prisma.building.findUnique({ where: { id: buildingId } });
  if (!building || !canManageBuilding(ctx, building)) {
    return null;
  }

  const now = new Date();

  const [
    residentCount,
    apartmentCount,
    openIssueCount,
    activeVoteCount,
    documentCount,
    announcements,
    recentIssues,
    activity,
  ] = await Promise.all([
    prisma.membership.count({
      where: { buildingId, role: "RESIDENT", isActive: true },
    }),
    prisma.apartment.count({ where: { buildingId } }),
    prisma.issue.count({
      where: { buildingId, status: { in: ["REPORTED", "IN_PROGRESS"] } },
    }),
    prisma.vote.count({
      where: { buildingId, startsAt: { lte: now }, endsAt: { gte: now } },
    }),
    prisma.document.count({ where: { buildingId } }),
    prisma.announcement.findMany({
      where: { buildingId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { author: true },
    }),
    prisma.issue.findMany({
      where: { buildingId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { reporter: true, apartment: true },
    }),
    prisma.activityLog.findMany({
      where: { buildingId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { actor: true },
    }),
  ]);

  return {
    building,
    residentCount,
    apartmentCount,
    openIssueCount,
    activeVoteCount,
    documentCount,
    announcements,
    recentIssues,
    activity,
  };
}

export async function getManagerDashboard(ctx: AccessContext) {
  const buildings = await getAccessibleBuildings(ctx);
  const buildingIds = buildings.map((building) => building.id);

  const [apartmentCount, residentCount, openIssueCount, activity, apartmentGroups, residentGroups, issueGroups] =
    await Promise.all([
      prisma.apartment.count({ where: { buildingId: { in: buildingIds } } }),
      prisma.membership.count({
        where: { buildingId: { in: buildingIds }, role: "RESIDENT", isActive: true },
      }),
      prisma.issue.count({
        where: {
          buildingId: { in: buildingIds },
          status: { in: ["REPORTED", "IN_PROGRESS"] },
        },
      }),
      prisma.activityLog.findMany({
        where: { buildingId: { in: buildingIds } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { actor: true, building: true },
      }),
      prisma.apartment.groupBy({
        by: ["buildingId"],
        where: { buildingId: { in: buildingIds } },
        _count: { _all: true },
      }),
      prisma.membership.groupBy({
        by: ["buildingId"],
        where: { buildingId: { in: buildingIds }, role: "RESIDENT", isActive: true },
        _count: { _all: true },
      }),
      prisma.issue.groupBy({
        by: ["buildingId"],
        where: {
          buildingId: { in: buildingIds },
          status: { in: ["REPORTED", "IN_PROGRESS"] },
        },
        _count: { _all: true },
      }),
    ]);

  const apartmentsByBuilding = countByBuilding(apartmentGroups);
  const residentsByBuilding = countByBuilding(residentGroups);
  const issuesByBuilding = countByBuilding(issueGroups);

  const buildingSummaries = buildings.map((building) => ({
    ...building,
    apartments: apartmentsByBuilding[building.id] ?? 0,
    residents: residentsByBuilding[building.id] ?? 0,
    openIssues: issuesByBuilding[building.id] ?? 0,
  }));

  return {
    buildings: buildingSummaries,
    totals: {
      buildings: buildings.length,
      apartments: apartmentCount,
      residents: residentCount,
      openIssues: openIssueCount,
    },
    activity,
  };
}

export async function getBuildingOverview(ctx: AccessContext, buildingId: string) {
  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    include: { organization: true },
  });

  if (!building || !canManageBuilding(ctx, building)) {
    return null;
  }

  const [residents, issues, activity] = await Promise.all([
    prisma.membership.findMany({
      where: { buildingId, isActive: true },
      include: { user: true, apartment: true },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
    prisma.issue.findMany({
      where: { buildingId },
      include: { reporter: true, apartment: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.activityLog.findMany({
      where: { buildingId },
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return { building, residents, issues, activity };
}

export async function listBuildingDirectory(ctx: AccessContext, buildingId: string) {
  const building = await prisma.building.findUnique({ where: { id: buildingId } });
  if (!building || !canViewResidents(ctx, building)) {
    return null;
  }

  const residents = await prisma.membership.findMany({
    where: { buildingId, isActive: true },
    include: { user: true, apartment: true },
    orderBy: [{ role: "asc" }, { apartment: { number: "asc" } }],
  });

  return { building, residents };
}
