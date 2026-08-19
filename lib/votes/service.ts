import { prisma } from "@/lib/db/prisma";
import { logActivity } from "@/lib/activity";
import { notifyBuildingResidents } from "@/lib/notifications";
import { AppError } from "@/lib/errors";
import {
  canCastVote,
  canCreateVote,
  canViewVote,
  canViewVoteResults,
} from "@/lib/permissions";
import { getVoteLifecycle } from "@/lib/votes/status";
import { createVoteSchema, type CreateVoteInput } from "@/lib/validations/votes";
import type { AccessContext } from "@/types/auth";

function isUniqueViolation(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

async function getBuildingOrThrow(buildingId: string) {
  const building = await prisma.building.findUnique({ where: { id: buildingId } });
  if (!building) {
    throw new AppError("NOT_FOUND", "Building not found");
  }

  return building;
}

export async function listVotesForBuilding(ctx: AccessContext, buildingId: string) {
  const building = await getBuildingOrThrow(buildingId);
  if (!canViewVote(ctx, building)) {
    throw new AppError("FORBIDDEN", "You cannot view votes for this building");
  }

  const votes = await prisma.vote.findMany({
    where: { buildingId },
    include: {
      options: { orderBy: { position: "asc" } },
      responses: {
        where: { userId: ctx.user.id },
        take: 1,
        include: { option: true },
      },
      _count: { select: { responses: true } },
    },
  });

  const rank = { OPEN: 0, UPCOMING: 1, CLOSED: 2 } as const;

  return votes
    .map((vote) => {
      const status = getVoteLifecycle(vote);
      return {
        id: vote.id,
        title: vote.title,
        description: vote.description,
        startsAt: vote.startsAt,
        endsAt: vote.endsAt,
        createdAt: vote.createdAt,
        status,
        optionCount: vote.options.length,
        responseCount: vote._count.responses,
        hasVoted: vote.responses.length > 0,
        myOptionLabel: vote.responses[0]?.option.label ?? null,
      };
    })
    .sort((a, b) => {
      if (rank[a.status] !== rank[b.status]) {
        return rank[a.status] - rank[b.status];
      }
      if (a.status === "CLOSED") {
        return b.endsAt.getTime() - a.endsAt.getTime();
      }
      return a.endsAt.getTime() - b.endsAt.getTime();
    });
}

export async function getVoteForUser(ctx: AccessContext, voteId: string) {
  const vote = await prisma.vote.findUnique({
    where: { id: voteId },
    include: {
      building: true,
      createdBy: true,
      options: { orderBy: { position: "asc" } },
    },
  });

  if (!vote) {
    throw new AppError("NOT_FOUND", "Vote not found");
  }

  if (!canViewVote(ctx, vote.building)) {
    throw new AppError("FORBIDDEN", "You cannot view this vote");
  }

  const [myResponse, counts, responseCount, eligibleCount] = await Promise.all([
    prisma.voteResponse.findUnique({
      where: { voteId_userId: { voteId: vote.id, userId: ctx.user.id } },
      include: { option: true },
    }),
    prisma.voteResponse.groupBy({
      by: ["optionId"],
      where: { voteId: vote.id },
      _count: { _all: true },
    }),
    prisma.voteResponse.count({ where: { voteId: vote.id } }),
    prisma.membership.count({
      where: { buildingId: vote.buildingId, role: "RESIDENT", isActive: true },
    }),
  ]);

  const showResults = canViewVoteResults(ctx, vote, vote.building);
  const countByOption = Object.fromEntries(counts.map((row) => [row.optionId, row._count._all]));
  const status = getVoteLifecycle(vote);

  return {
    id: vote.id,
    title: vote.title,
    description: vote.description,
    startsAt: vote.startsAt,
    endsAt: vote.endsAt,
    createdAt: vote.createdAt,
    building: vote.building,
    createdBy: vote.createdBy,
    status,
    canCast: canCastVote(ctx, vote.building) && status === "OPEN" && !myResponse,
    showResults,
    responseCount,
    eligibleCount,
    myOptionId: myResponse?.optionId ?? null,
    myOptionLabel: myResponse?.option.label ?? null,
    options: vote.options.map((option) => ({
      id: option.id,
      label: option.label,
      position: option.position,
      count: showResults ? (countByOption[option.id] ?? 0) : null,
    })),
  };
}

export async function createVote(ctx: AccessContext, buildingId: string, input: CreateVoteInput) {
  const parsed = createVoteSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid vote");
  }

  const building = await getBuildingOrThrow(buildingId);
  if (!canCreateVote(ctx, building)) {
    throw new AppError("FORBIDDEN", "You cannot create votes for this building");
  }

  const vote = await prisma.vote.create({
    data: {
      buildingId: building.id,
      createdById: ctx.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      startsAt: parsed.data.startsAt,
      endsAt: parsed.data.endsAt,
      options: {
        create: parsed.data.options.map((label, position) => ({ label, position })),
      },
    },
    include: { options: true },
  });

  await logActivity({
    actorId: ctx.user.id,
    action: "VOTE_CREATED",
    entityType: "Vote",
    entityId: vote.id,
    organizationId: building.organizationId,
    buildingId: building.id,
    metadata: { title: vote.title },
  });

  await notifyBuildingResidents({
    buildingId: building.id,
    type: "VOTE_CREATED",
    title: `New vote: ${vote.title}`,
    body: "A new building vote is open. Cast your vote before it closes.",
    data: { voteId: vote.id },
  });

  return vote;
}

export async function castVote(ctx: AccessContext, voteId: string, optionId: string) {
  const vote = await prisma.vote.findUnique({
    where: { id: voteId },
    include: { building: true, options: true },
  });

  if (!vote) {
    throw new AppError("NOT_FOUND", "Vote not found");
  }

  if (!canCastVote(ctx, vote.building)) {
    throw new AppError("FORBIDDEN", "You cannot vote in this building");
  }

  const status = getVoteLifecycle(vote);
  if (status === "UPCOMING") {
    throw new AppError("VALIDATION", "This vote is not open yet");
  }
  if (status === "CLOSED") {
    throw new AppError("VALIDATION", "This vote has closed");
  }

  const option = vote.options.find((item) => item.id === optionId);
  if (!option) {
    throw new AppError("VALIDATION", "Choose a valid option");
  }

  const existing = await prisma.voteResponse.findUnique({
    where: { voteId_userId: { voteId: vote.id, userId: ctx.user.id } },
  });
  if (existing) {
    throw new AppError("VALIDATION", "You have already voted");
  }

  try {
    await prisma.voteResponse.create({
      data: {
        voteId: vote.id,
        optionId: option.id,
        userId: ctx.user.id,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("VALIDATION", "You have already voted");
    }
    throw error;
  }

  await logActivity({
    actorId: ctx.user.id,
    action: "VOTE_CAST",
    entityType: "Vote",
    entityId: vote.id,
    organizationId: vote.building.organizationId,
    buildingId: vote.building.id,
    metadata: { title: vote.title },
  });

  return { voteId: vote.id, optionId: option.id };
}
