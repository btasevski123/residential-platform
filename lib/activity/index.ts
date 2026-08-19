import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { ActivityAction } from "@/generated/prisma/enums";

type LogActivityInput = {
  actorId: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  organizationId?: string | null;
  buildingId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function logActivity(input: LogActivityInput) {
  return prisma.activityLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      organizationId: input.organizationId ?? null,
      buildingId: input.buildingId ?? null,
      metadata: input.metadata,
    },
  });
}
