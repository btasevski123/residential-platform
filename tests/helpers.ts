import "dotenv/config";

import { prisma } from "../lib/db/prisma";
import type { AccessContext } from "../types/auth";

export async function loadContext(email: string): Promise<AccessContext> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      organizationMemberships: true,
      memberships: {
        include: {
          building: true,
          apartment: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error(`Demo user missing: ${email}`);
  }

  return {
    user,
    organizationMemberships: user.organizationMemberships,
    memberships: user.memberships,
    session: {
      id: "test-session",
      activeBuildingId: user.memberships.find((item) => item.isActive)?.buildingId ?? null,
    },
  };
}

export async function getBuildingBySlug(slug: string) {
  const building = await prisma.building.findUnique({
    where: {
      organizationId_slug: {
        organizationId: (await prisma.organization.findUniqueOrThrow({ where: { slug: "cityhome-management" } })).id,
        slug,
      },
    },
  });

  if (!building) {
    throw new Error(`Building missing: ${slug}`);
  }

  return building;
}

export { prisma };
