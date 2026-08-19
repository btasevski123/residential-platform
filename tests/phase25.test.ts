import assert from "node:assert/strict";
import { after, test } from "node:test";
import { AppError } from "../lib/errors";
import { createIssue, getIssueForUser, updateIssueStatus } from "../lib/issues/service";
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../lib/notifications/service";
import { getBuildingBySlug, loadContext, prisma } from "./helpers";

const createdIssueIds: string[] = [];
const createdNotificationIds: string[] = [];

function isForbiddenOrMissing(error: unknown) {
  return error instanceof AppError && (error.code === "FORBIDDEN" || error.code === "NOT_FOUND");
}

after(async () => {
  if (createdIssueIds.length > 0) {
    await prisma.notification.deleteMany({
      where: {
        OR: createdIssueIds.map((issueId) => ({
          data: { path: ["issueId"], equals: issueId },
        })),
      },
    });
    await prisma.issue.deleteMany({ where: { id: { in: createdIssueIds } } });
  }
  if (createdNotificationIds.length > 0) {
    await prisma.notification.deleteMany({ where: { id: { in: createdNotificationIds } } });
  }
  await prisma.$disconnect();
});

test("status change notifies the reporter with an issue update", async () => {
  const resident = await loadContext("resident@cityhome.mk");
  const admin = await loadContext("admin@cityhome.mk");
  const building = await getBuildingBySlug("skopje-center-12");
  const issue = await createIssue(resident, building.id, {
    title: `Phase 2.5 notify ${Date.now()}`,
    description: "Used to verify reporter notifications.",
    category: "ELEVATOR",
  });
  createdIssueIds.push(issue.id);

  await updateIssueStatus(admin, issue.id, "IN_PROGRESS");

  const notification = await prisma.notification.findFirst({
    where: {
      userId: resident.user.id,
      title: "Your issue is now in progress.",
    },
    orderBy: { createdAt: "desc" },
  });

  assert.ok(notification);
  createdNotificationIds.push(notification.id);
  assert.equal(notification.type, "SYSTEM");
  assert.equal(notification.readAt, null);
});

test("users only see their own notifications", async () => {
  const resident = await loadContext("resident@cityhome.mk");
  const admin = await loadContext("admin@cityhome.mk");

  const mine = await prisma.notification.create({
    data: {
      userId: resident.user.id,
      type: "SYSTEM",
      title: "Resident-only notice",
      body: "Should not appear for the admin.",
    },
  });
  createdNotificationIds.push(mine.id);

  const residentList = await listMyNotifications(resident);
  const adminList = await listMyNotifications(admin);

  assert.ok(residentList.some((item) => item.id === mine.id));
  assert.equal(adminList.some((item) => item.id === mine.id), false);
});

test("a user cannot mark another user's notification as read", async () => {
  const resident = await loadContext("resident@cityhome.mk");
  const admin = await loadContext("admin@cityhome.mk");

  const notification = await prisma.notification.create({
    data: {
      userId: admin.user.id,
      type: "ISSUE_REPORTED",
      title: "Admin-only notice",
      body: "Resident must not be able to mark this read.",
    },
  });
  createdNotificationIds.push(notification.id);

  await assert.rejects(() => markNotificationRead(resident, notification.id), isForbiddenOrMissing);

  const stillUnread = await prisma.notification.findUniqueOrThrow({ where: { id: notification.id } });
  assert.equal(stillUnread.readAt, null);
});

test("mark all as read only updates the authenticated user's rows", async () => {
  const resident = await loadContext("resident@cityhome.mk");
  const admin = await loadContext("admin@cityhome.mk");

  const residentNotice = await prisma.notification.create({
    data: {
      userId: resident.user.id,
      type: "SYSTEM",
      title: "Resident mark-all",
      body: "Should become read.",
    },
  });
  const adminNotice = await prisma.notification.create({
    data: {
      userId: admin.user.id,
      type: "SYSTEM",
      title: "Admin remains unread",
      body: "Should stay unread.",
    },
  });
  createdNotificationIds.push(residentNotice.id, adminNotice.id);

  await markAllNotificationsRead(resident);

  const residentUpdated = await prisma.notification.findUniqueOrThrow({ where: { id: residentNotice.id } });
  const adminUpdated = await prisma.notification.findUniqueOrThrow({ where: { id: adminNotice.id } });

  assert.ok(residentUpdated.readAt);
  assert.equal(adminUpdated.readAt, null);
});

test("resident cannot view another resident's issue", async () => {
  const resident = await loadContext("resident@cityhome.mk");
  const otherMembership = await prisma.membership.findFirst({
    where: {
      role: "RESIDENT",
      isActive: true,
      user: { email: { not: "resident@cityhome.mk" } },
      building: { slug: "skopje-center-12" },
    },
    include: { user: true },
  });
  assert.ok(otherMembership);

  const other = await loadContext(otherMembership.user.email);
  const building = await getBuildingBySlug("skopje-center-12");
  const issue = await createIssue(other, building.id, {
    title: `Phase 2.5 other resident ${Date.now()}`,
    description: "This issue belongs to another resident.",
    category: "GENERAL",
  });
  createdIssueIds.push(issue.id);

  await assert.rejects(() => getIssueForUser(resident, issue.id), isForbiddenOrMissing);
});
