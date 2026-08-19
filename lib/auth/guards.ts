import "server-only";

import { redirect } from "next/navigation";
import { getAccessContext } from "@/lib/auth/current-user";
import {
  canAccessAdminConsole,
  canAccessManagerConsole,
  canAccessResidentApp,
  canViewBuilding,
  getDefaultHomePath,
} from "@/lib/permissions";
import { getAccessibleBuildings, getCurrentBuilding } from "@/lib/db/tenant";
import type { AccessContext, BuildingRef } from "@/types/auth";

export async function requireAccessContext(): Promise<AccessContext> {
  const ctx = await getAccessContext();
  if (!ctx) {
    redirect("/login");
  }

  return ctx;
}

export async function requireResidentContext() {
  const ctx = await requireAccessContext();
  if (!canAccessResidentApp(ctx)) {
    redirect(getDefaultHomePath(ctx));
  }

  const building = await getCurrentBuilding(ctx);
  if (!building || !canViewBuilding(ctx, building)) {
    redirect(getDefaultHomePath(ctx));
  }

  return { ctx, building };
}

export async function requireAdminContext() {
  const ctx = await requireAccessContext();
  if (!canAccessAdminConsole(ctx)) {
    redirect(getDefaultHomePath(ctx));
  }

  const building = await getCurrentBuilding(ctx);
  if (!building) {
    redirect(getDefaultHomePath(ctx));
  }

  return { ctx, building };
}

export async function requireManagerContext() {
  const ctx = await requireAccessContext();
  if (!canAccessManagerConsole(ctx)) {
    redirect(getDefaultHomePath(ctx));
  }

  const buildings = await getAccessibleBuildings(ctx);
  return { ctx, buildings };
}

export function assertBuildingAccess(
  ctx: AccessContext,
  building: BuildingRef,
  allowed: (context: AccessContext, target: BuildingRef) => boolean,
) {
  if (!allowed(ctx, building)) {
    redirect(getDefaultHomePath(ctx));
  }
}
