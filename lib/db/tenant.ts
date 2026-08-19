import "server-only";

import { prisma } from "@/lib/db/client";
import { canViewBuilding, isOrgStaff } from "@/lib/permissions";
import type { AccessContext } from "@/types/auth";

export async function getAccessibleBuildings(ctx: AccessContext) {
  const orgIds = ctx.organizationMemberships
    .filter((membership) => membership.isActive)
    .map((membership) => membership.organizationId);

  if (orgIds.length > 0) {
    return prisma.building.findMany({
      where: { organizationId: { in: orgIds } },
      include: { organization: true },
      orderBy: { name: "asc" },
    });
  }

  const buildingIds = ctx.memberships
    .filter((membership) => membership.isActive)
    .map((membership) => membership.buildingId);

  return prisma.building.findMany({
    where: { id: { in: buildingIds } },
    include: { organization: true },
    orderBy: { name: "asc" },
  });
}

export async function getBuildingForUser(ctx: AccessContext, buildingId: string) {
  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    include: { organization: true },
  });

  if (!building || !canViewBuilding(ctx, building)) {
    return null;
  }

  return building;
}

export async function getCurrentBuilding(ctx: AccessContext) {
  const buildings = await getAccessibleBuildings(ctx);
  if (buildings.length === 0) {
    return null;
  }

  if (ctx.session.activeBuildingId) {
    const active = buildings.find((building) => building.id === ctx.session.activeBuildingId);
    if (active) {
      return active;
    }
  }

  const membershipBuilding = buildings.find((building) =>
    ctx.memberships.some((membership) => membership.buildingId === building.id && membership.isActive),
  );

  return membershipBuilding ?? buildings[0];
}

export async function getManagedOrganization(ctx: AccessContext) {
  const organizationId = ctx.organizationMemberships.find((membership) => membership.isActive)
    ?.organizationId;

  if (!organizationId || !isOrgStaff(ctx, organizationId)) {
    return null;
  }

  return prisma.organization.findUnique({
    where: { id: organizationId },
  });
}
