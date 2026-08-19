import assert from "node:assert/strict";
import { after, test } from "node:test";
import { AppError } from "../lib/errors";
import { publishAnnouncement, getAnnouncementForUser } from "../lib/announcements/service";
import { createIssue, getIssueForUser, updateIssueStatus } from "../lib/issues/service";
import { getBuildingBySlug, loadContext, prisma } from "./helpers";

const createdAnnouncementIds: string[] = [];
const createdIssueIds: string[] = [];

function isForbidden(error: unknown) {
  return error instanceof AppError && error.code === "FORBIDDEN";
}

after(async () => {
  if (createdIssueIds.length > 0) {
    await prisma.issue.deleteMany({ where: { id: { in: createdIssueIds } } });
  }
  if (createdAnnouncementIds.length > 0) {
    await prisma.announcement.deleteMany({ where: { id: { in: createdAnnouncementIds } } });
  }
  await prisma.$disconnect();
});

test("resident cannot create an announcement", async () => {
  const resident = await loadContext("resident@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");

  await assert.rejects(
    () =>
      publishAnnouncement(resident, building.id, {
        title: "Unauthorized post",
        content: "Residents should not be able to publish this.",
        priority: "NORMAL",
      }),
    isForbidden,
  );
});

test("resident cannot access another building's announcement", async () => {
  const resident = await loadContext("resident@cityhome.mk");
  const other = await prisma.announcement.findFirst({
    where: { title: "Parking line repainting" },
  });

  assert.ok(other, "seed announcement for Aerodrom 25 is missing");
  await assert.rejects(() => getAnnouncementForUser(resident, other.id), isForbidden);
});

test("admin can create an announcement for their building", async () => {
  const admin = await loadContext("admin@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");
  const title = `Phase 2 test announcement ${Date.now()}`;

  const announcement = await publishAnnouncement(admin, building.id, {
    title,
    content: "Water supply will be interrupted tomorrow from 09:00 to 13:00.",
    priority: "URGENT",
  });
  createdAnnouncementIds.push(announcement.id);

  assert.equal(announcement.buildingId, building.id);
  assert.equal(announcement.authorId, admin.user.id);
  assert.ok(announcement.publishedAt);
});

test("resident can create an issue for their building", async () => {
  const resident = await loadContext("resident@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");
  const issue = await createIssue(resident, building.id, {
    title: `Phase 2 elevator test ${Date.now()}`,
    description: "The elevator is not responding.",
    category: "ELEVATOR",
  });
  createdIssueIds.push(issue.id);

  assert.equal(issue.buildingId, building.id);
  assert.equal(issue.reporterId, resident.user.id);
  assert.equal(issue.status, "REPORTED");
});

test("resident cannot create an issue for another building", async () => {
  const resident = await loadContext("resident@cityhome.mk");
  const otherBuilding = await getBuildingBySlug("aerodrom-25");

  await assert.rejects(
    () =>
      createIssue(resident, otherBuilding.id, {
        title: "Should not work",
        description: "This issue belongs to another building.",
        category: "GENERAL",
      }),
    isForbidden,
  );
});

test("admin can change issue status", async () => {
  const resident = await loadContext("resident@cityhome.mk");
  const admin = await loadContext("admin@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");
  const issue = await createIssue(resident, building.id, {
    title: `Phase 2 status test ${Date.now()}`,
    description: "Used to verify admin status changes.",
    category: "WATER",
  });
  createdIssueIds.push(issue.id);

  const updated = await updateIssueStatus(admin, issue.id, "IN_PROGRESS");
  assert.equal(updated.status, "IN_PROGRESS");

  const visible = await getIssueForUser(resident, issue.id);
  assert.equal(visible.status, "IN_PROGRESS");
});

test("unauthorized user cannot change issue status", async () => {
  const resident = await loadContext("resident@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");
  const issue = await createIssue(resident, building.id, {
    title: `Phase 2 forbidden status ${Date.now()}`,
    description: "Residents must not change status.",
    category: "GENERAL",
  });
  createdIssueIds.push(issue.id);

  await assert.rejects(() => updateIssueStatus(resident, issue.id, "IN_PROGRESS"), isForbidden);
});

test("status changes create ActivityLog entries", async () => {
  const resident = await loadContext("resident@cityhome.mk");
  const admin = await loadContext("admin@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");
  const issue = await createIssue(resident, building.id, {
    title: `Phase 2 activity test ${Date.now()}`,
    description: "Used to verify activity log writes.",
    category: "HEATING",
  });
  createdIssueIds.push(issue.id);

  await updateIssueStatus(admin, issue.id, "IN_PROGRESS");

  const log = await prisma.activityLog.findFirst({
    where: {
      entityType: "Issue",
      entityId: issue.id,
      action: "ISSUE_STATUS_CHANGED",
    },
  });

  assert.ok(log);
  assert.equal(log.actorId, admin.user.id);
  assert.equal(log.buildingId, building.id);
  const metadata = log.metadata as { fromStatus?: string; toStatus?: string };
  assert.equal(metadata.fromStatus, "REPORTED");
  assert.equal(metadata.toStatus, "IN_PROGRESS");
});
