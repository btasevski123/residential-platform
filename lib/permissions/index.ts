import type { AccessContext, BuildingRef } from "@/types/auth";

function activeOrgMemberships(ctx: AccessContext) {
  return ctx.organizationMemberships.filter((membership) => membership.isActive);
}

function activeBuildingMemberships(ctx: AccessContext) {
  return ctx.memberships.filter((membership) => membership.isActive);
}

export function isOrgAdmin(ctx: AccessContext, organizationId: string) {
  return activeOrgMemberships(ctx).some(
    (membership) =>
      membership.organizationId === organizationId && membership.role === "ORG_ADMIN",
  );
}

export function isOrgManager(ctx: AccessContext, organizationId: string) {
  return activeOrgMemberships(ctx).some(
    (membership) =>
      membership.organizationId === organizationId && membership.role === "MANAGER",
  );
}

export function isOrgStaff(ctx: AccessContext, organizationId: string) {
  return isOrgAdmin(ctx, organizationId) || isOrgManager(ctx, organizationId);
}

export function getBuildingMembership(ctx: AccessContext, buildingId: string) {
  return activeBuildingMemberships(ctx).find(
    (membership) => membership.buildingId === buildingId,
  );
}

export function isBuildingAdmin(ctx: AccessContext, buildingId: string) {
  return getBuildingMembership(ctx, buildingId)?.role === "BUILDING_ADMIN";
}

export function isResident(ctx: AccessContext, buildingId: string) {
  return getBuildingMembership(ctx, buildingId)?.role === "RESIDENT";
}

export function canViewBuilding(ctx: AccessContext, building: BuildingRef) {
  if (isOrgStaff(ctx, building.organizationId)) {
    return true;
  }

  return Boolean(getBuildingMembership(ctx, building.id));
}

export function canManageBuilding(ctx: AccessContext, building: BuildingRef) {
  if (isOrgStaff(ctx, building.organizationId)) {
    return true;
  }

  return isBuildingAdmin(ctx, building.id);
}

export function canCreateAnnouncement(ctx: AccessContext, building: BuildingRef) {
  return canManageBuilding(ctx, building);
}

export function canManageIssues(ctx: AccessContext, building: BuildingRef) {
  return canManageBuilding(ctx, building);
}

export function canCreateIssue(ctx: AccessContext, building: BuildingRef) {
  return isResident(ctx, building.id);
}

export function canViewAnnouncement(
  ctx: AccessContext,
  announcement: { publishedAt: Date | null },
  building: BuildingRef,
) {
  if (canManageBuilding(ctx, building)) {
    return true;
  }

  return Boolean(announcement.publishedAt) && canViewBuilding(ctx, building);
}

export function canViewIssue(
  ctx: AccessContext,
  issue: { reporterId: string },
  building: BuildingRef,
) {
  if (canManageIssues(ctx, building)) {
    return true;
  }

  return issue.reporterId === ctx.user.id && canViewBuilding(ctx, building);
}

export function canUpdateIssueStatus(ctx: AccessContext, building: BuildingRef) {
  return canManageIssues(ctx, building);
}

export function canCreateVote(ctx: AccessContext, building: BuildingRef) {
  return canManageBuilding(ctx, building);
}

export function canCastVote(ctx: AccessContext, building: BuildingRef) {
  return isResident(ctx, building.id);
}

export function canManageDocuments(ctx: AccessContext, building: BuildingRef) {
  return canManageBuilding(ctx, building);
}

export function canViewDocuments(ctx: AccessContext, building: BuildingRef) {
  return canViewBuilding(ctx, building);
}

export function canViewResidents(ctx: AccessContext, building: BuildingRef) {
  return canManageBuilding(ctx, building);
}

export function canAccessManagerConsole(ctx: AccessContext) {
  return activeOrgMemberships(ctx).some(
    (membership) => membership.role === "ORG_ADMIN" || membership.role === "MANAGER",
  );
}

export function canAccessAdminConsole(ctx: AccessContext) {
  if (canAccessManagerConsole(ctx)) {
    return true;
  }

  return activeBuildingMemberships(ctx).some(
    (membership) => membership.role === "BUILDING_ADMIN",
  );
}

export function canAccessResidentApp(ctx: AccessContext) {
  return activeBuildingMemberships(ctx).some(
    (membership) => membership.role === "RESIDENT",
  );
}

export function getPrimaryOrganizationId(ctx: AccessContext) {
  return activeOrgMemberships(ctx)[0]?.organizationId ?? null;
}

export function getDefaultHomePath(ctx: AccessContext) {
  if (canAccessManagerConsole(ctx)) {
    return "/manager/dashboard";
  }

  if (canAccessAdminConsole(ctx)) {
    return "/admin/dashboard";
  }

  return "/dashboard";
}
