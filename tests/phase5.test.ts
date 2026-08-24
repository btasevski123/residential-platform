import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createVote } from "../lib/votes/service";
import { notifyBuildingResidents } from "../lib/notifications/index";
import { setEmailTransportForTests, type NotificationEmail } from "../lib/notifications/email";
import { getBuildingBySlug, loadContext, prisma } from "./helpers";

const createdVoteIds: string[] = [];
const createdNotificationIds: string[] = [];
const capturedEmails: NotificationEmail[] = [];

function openVoteInput(title = `Phase 5 vote ${Date.now()}`) {
  return {
    title,
    description: "Used to verify email dispatch on top of the existing inbox.",
    startsAt: new Date(Date.now() - 60_000),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    options: ["Yes", "No"],
  };
}

after(async () => {
  setEmailTransportForTests(null);
  await prisma.user.updateMany({
    where: { email: { in: ["resident@cityhome.mk", "admin@cityhome.mk"] } },
    data: { emailNotificationsEnabled: true, pushNotificationsEnabled: true },
  });
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
  if (createdNotificationIds.length > 0) {
    await prisma.notification.deleteMany({ where: { id: { in: createdNotificationIds } } });
  }
  await prisma.$disconnect();
});

test("inbox rows are still created when email transport is a stub", async () => {
  capturedEmails.length = 0;
  setEmailTransportForTests(async (email) => {
    capturedEmails.push(email);
    return { id: "test-email" };
  });

  const admin = await loadContext("admin@cityhome.mk");
  const resident = await loadContext("resident@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");
  const vote = await createVote(admin, building.id, openVoteInput());
  createdVoteIds.push(vote.id);

  const inbox = await prisma.notification.findFirst({
    where: {
      userId: resident.user.id,
      type: "VOTE_CREATED",
      data: { path: ["voteId"], equals: vote.id },
    },
  });
  assert.ok(inbox);

  const mailed = capturedEmails.filter((email) => email.to === resident.user.email);
  assert.equal(mailed.length, 1);
  assert.match(mailed[0].url, /\/voting\//);

  const delivery = await prisma.notificationDelivery.findUnique({
    where: { notificationId_channel: { notificationId: inbox.id, channel: "EMAIL" } },
  });
  assert.equal(delivery?.status, "SENT");
});

test("email is skipped when the user turned email off", async () => {
  capturedEmails.length = 0;
  setEmailTransportForTests(async (email) => {
    capturedEmails.push(email);
    return { id: "test-email" };
  });

  await prisma.user.update({
    where: { email: "resident@cityhome.mk" },
    data: { emailNotificationsEnabled: true },
  });
  const resident = await loadContext("resident@cityhome.mk");
  await prisma.user.update({
    where: { id: resident.user.id },
    data: { emailNotificationsEnabled: false },
  });

  const created = await notifyBuildingResidents({
    buildingId: (await getBuildingBySlug("skopje-center-12")).id,
    type: "VOTE_CREATED",
    title: "Pref-off vote notice",
    body: "Should stay in the inbox only.",
    data: { voteId: "pref-off-test" },
  });
  createdNotificationIds.push(...created.ids);

  const inbox = await prisma.notification.findFirst({
    where: { id: { in: created.ids }, userId: resident.user.id },
  });
  assert.ok(inbox);

  const mailed = capturedEmails.filter((email) => email.to === resident.user.email);
  assert.equal(mailed.length, 0);

  const delivery = await prisma.notificationDelivery.findUnique({
    where: { notificationId_channel: { notificationId: inbox.id, channel: "EMAIL" } },
  });
  assert.equal(delivery, null);

  await prisma.user.update({
    where: { id: resident.user.id },
    data: { emailNotificationsEnabled: true },
  });
});

test("missing email keys do not throw or remove the inbox row", async () => {
  const previousKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  setEmailTransportForTests(null);

  try {
    const created = await notifyBuildingResidents({
      buildingId: (await getBuildingBySlug("skopje-center-12")).id,
      type: "VOTE_CREATED",
      title: "No-key dispatch",
      body: "Inbox must survive a skipped adapter.",
      data: { voteId: "no-key-dispatch" },
    });
    createdNotificationIds.push(...created.ids);

    const resident = await loadContext("resident@cityhome.mk");
    const inbox = await prisma.notification.findFirst({
      where: { id: { in: created.ids }, userId: resident.user.id },
    });
    assert.ok(inbox);

    const delivery = await prisma.notificationDelivery.findUnique({
      where: { notificationId_channel: { notificationId: inbox.id, channel: "EMAIL" } },
    });
    assert.equal(delivery, null);
  } finally {
    if (previousKey) {
      process.env.RESEND_API_KEY = previousKey;
    }
  }
});

test("a resident is not emailed for another building's notice", async () => {
  capturedEmails.length = 0;
  setEmailTransportForTests(async (email) => {
    capturedEmails.push(email);
    return { id: "test-email" };
  });

  const resident = await loadContext("resident@cityhome.mk");
  const manager = await loadContext("manager@cityhome.mk");
  const otherBuilding = await getBuildingBySlug("aerodrom-25");
  const vote = await createVote(manager, otherBuilding.id, openVoteInput("Aerodrom dispatch vote"));
  createdVoteIds.push(vote.id);

  const inbox = await prisma.notification.findFirst({
    where: {
      userId: resident.user.id,
      data: { path: ["voteId"], equals: vote.id },
    },
  });
  assert.equal(inbox, null);

  const mailed = capturedEmails.filter((email) => email.to === resident.user.email);
  assert.equal(mailed.length, 0);
});
