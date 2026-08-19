import assert from "node:assert/strict";
import { after, test } from "node:test";
import { AppError } from "../lib/errors";
import { createVote, castVote, getVoteForUser } from "../lib/votes/service";
import { getBuildingBySlug, loadContext, prisma } from "./helpers";

const createdVoteIds: string[] = [];

function isForbidden(error: unknown) {
  return error instanceof AppError && error.code === "FORBIDDEN";
}

function isValidation(error: unknown) {
  return error instanceof AppError && error.code === "VALIDATION";
}

function openVoteInput(title = `Phase 3 test vote ${Date.now()}`) {
  return {
    title,
    description: "This poll exists so Phase 3 authorization tests can run against Postgres.",
    startsAt: new Date(Date.now() - 60_000),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    options: ["Approve", "Reject"],
  };
}

after(async () => {
  if (createdVoteIds.length > 0) {
    await prisma.notification.deleteMany({
      where: {
        OR: createdVoteIds.map((voteId) => ({
          data: { path: ["voteId"], equals: voteId },
        })),
      },
    });
    await prisma.activityLog.deleteMany({
      where: { entityType: "Vote", entityId: { in: createdVoteIds } },
    });
    await prisma.vote.deleteMany({ where: { id: { in: createdVoteIds } } });
  }
  await prisma.$disconnect();
});

test("resident cannot create a vote", async () => {
  const resident = await loadContext("resident@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");

  await assert.rejects(() => createVote(resident, building.id, openVoteInput()), isForbidden);
});

test("admin can create a vote for their building", async () => {
  const admin = await loadContext("admin@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");
  const vote = await createVote(admin, building.id, openVoteInput());
  createdVoteIds.push(vote.id);

  assert.equal(vote.buildingId, building.id);
  assert.equal(vote.createdById, admin.user.id);
  assert.equal(vote.options.length, 2);
});

test("resident cannot access another building's vote", async () => {
  const resident = await loadContext("resident@cityhome.mk");
  const manager = await loadContext("manager@cityhome.mk");
  const otherBuilding = await getBuildingBySlug("aerodrom-25");
  const vote = await createVote(manager, otherBuilding.id, openVoteInput("Aerodrom only vote"));
  createdVoteIds.push(vote.id);

  await assert.rejects(() => getVoteForUser(resident, vote.id), isForbidden);
  await assert.rejects(() => castVote(resident, vote.id, vote.options[0].id), isForbidden);
});

test("resident can cast one vote while it is open", async () => {
  const admin = await loadContext("admin@cityhome.mk");
  const resident = await loadContext("resident@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");
  const vote = await createVote(admin, building.id, openVoteInput());
  createdVoteIds.push(vote.id);

  const result = await castVote(resident, vote.id, vote.options[0].id);
  assert.equal(result.optionId, vote.options[0].id);

  await assert.rejects(() => castVote(resident, vote.id, vote.options[1].id), isValidation);

  const detail = await getVoteForUser(resident, vote.id);
  assert.equal(detail.myOptionId, vote.options[0].id);
  assert.equal(detail.showResults, false);
  assert.equal(detail.options[0].count, null);
});

test("admin cannot cast a vote", async () => {
  const admin = await loadContext("admin@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");
  const vote = await createVote(admin, building.id, openVoteInput());
  createdVoteIds.push(vote.id);

  await assert.rejects(() => castVote(admin, vote.id, vote.options[0].id), isForbidden);
});

test("resident cannot vote before open or after close", async () => {
  const admin = await loadContext("admin@cityhome.mk");
  const resident = await loadContext("resident@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");

  const upcoming = await createVote(admin, building.id, {
    ...openVoteInput("Upcoming phase 3 vote"),
    startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    endsAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
  });
  createdVoteIds.push(upcoming.id);
  await assert.rejects(() => castVote(resident, upcoming.id, upcoming.options[0].id), isValidation);

  const closing = await createVote(admin, building.id, openVoteInput("Soon closed phase 3 vote"));
  createdVoteIds.push(closing.id);
  await prisma.vote.update({
    where: { id: closing.id },
    data: { endsAt: new Date(Date.now() - 1000) },
  });
  await assert.rejects(() => castVote(resident, closing.id, closing.options[0].id), isValidation);
});

test("residents see option counts only after close; staff see them live", async () => {
  const admin = await loadContext("admin@cityhome.mk");
  const resident = await loadContext("resident@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");
  const vote = await createVote(admin, building.id, openVoteInput());
  createdVoteIds.push(vote.id);
  await castVote(resident, vote.id, vote.options[0].id);

  const staffView = await getVoteForUser(admin, vote.id);
  assert.equal(staffView.showResults, true);
  assert.equal(staffView.options[0].count, 1);

  await prisma.vote.update({
    where: { id: vote.id },
    data: { endsAt: new Date(Date.now() - 1000) },
  });

  const residentView = await getVoteForUser(resident, vote.id);
  assert.equal(residentView.showResults, true);
  assert.equal(residentView.options[0].count, 1);
});

test("creating a vote writes activity and notifies residents", async () => {
  const admin = await loadContext("admin@cityhome.mk");
  const resident = await loadContext("resident@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");
  const vote = await createVote(admin, building.id, openVoteInput());
  createdVoteIds.push(vote.id);

  const activity = await prisma.activityLog.findFirst({
    where: { entityType: "Vote", entityId: vote.id, action: "VOTE_CREATED" },
  });
  assert.ok(activity);
  assert.equal(activity.actorId, admin.user.id);

  const notification = await prisma.notification.findFirst({
    where: {
      userId: resident.user.id,
      type: "VOTE_CREATED",
      data: { path: ["voteId"], equals: vote.id },
    },
  });
  assert.ok(notification);
});

test("casting a vote writes VOTE_CAST activity without storing the option", async () => {
  const admin = await loadContext("admin@cityhome.mk");
  const resident = await loadContext("resident@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");
  const vote = await createVote(admin, building.id, openVoteInput());
  createdVoteIds.push(vote.id);
  await castVote(resident, vote.id, vote.options[0].id);

  const activity = await prisma.activityLog.findFirst({
    where: { entityType: "Vote", entityId: vote.id, action: "VOTE_CAST" },
  });
  assert.ok(activity);
  assert.equal(activity.actorId, resident.user.id);
  assert.ok(!JSON.stringify(activity.metadata).includes(vote.options[0].id));
});
