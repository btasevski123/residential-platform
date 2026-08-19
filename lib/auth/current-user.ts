import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db/client";
import { getSessionFromCookie } from "@/lib/auth/session";
import type { AccessContext } from "@/types/auth";

export const getAccessContext = cache(async (): Promise<AccessContext | null> => {
  const session = await getSessionFromCookie();
  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
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

  if (!user || !user.isActive) {
    return null;
  }

  return {
    user,
    organizationMemberships: user.organizationMemberships,
    memberships: user.memberships,
    session: {
      id: session.id,
      activeBuildingId: session.activeBuildingId,
    },
  };
});
