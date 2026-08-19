import type { NotificationType } from "@/generated/prisma/enums";
import type { ViewerKind } from "@/lib/navigation";

export type NotificationRecord = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: unknown;
  readAt: Date | null;
  createdAt: Date;
  buildingId: string | null;
};

export type NotificationPayloadData = {
  announcementId?: string;
  issueId?: string;
  voteId?: string;
  kind?: string;
  status?: string;
};

export function parseNotificationData(data: unknown): NotificationPayloadData {
  if (!data || typeof data !== "object") {
    return {};
  }

  return data as NotificationPayloadData;
}

export function notificationTypeLabel(notification: Pick<NotificationRecord, "type" | "data">) {
  const data = parseNotificationData(notification.data);

  if (notification.type === "ANNOUNCEMENT_URGENT") {
    return "Urgent announcement";
  }
  if (notification.type === "ANNOUNCEMENT_IMPORTANT") {
    return "Important announcement";
  }
  if (notification.type === "ISSUE_REPORTED") {
    return "New issue";
  }
  if (notification.type === "VOTE_CREATED" || notification.type === "VOTE_CLOSING_SOON") {
    return "Vote";
  }
  if (notification.type === "SYSTEM" && (data.kind === "ISSUE_UPDATE" || data.issueId)) {
    return "Issue update";
  }

  return "Update";
}

export function notificationHref(
  notification: Pick<NotificationRecord, "type" | "data" | "buildingId">,
  viewer: ViewerKind,
) {
  const data = parseNotificationData(notification.data);

  if (data.announcementId) {
    if (viewer === "resident") {
      return `/announcements/${data.announcementId}`;
    }
    if (viewer === "admin") {
      return `/admin/announcements/${data.announcementId}`;
    }
  }

  if (data.issueId) {
    if (viewer === "resident") {
      return `/issues/${data.issueId}`;
    }
    if (viewer === "admin") {
      return `/admin/issues/${data.issueId}`;
    }
    if (viewer === "manager" && notification.buildingId) {
      return `/manager/buildings/${notification.buildingId}`;
    }
  }

  if (data.voteId) {
    if (viewer === "resident") {
      return `/voting/${data.voteId}`;
    }
    if (viewer === "admin") {
      return `/admin/voting/${data.voteId}`;
    }
  }

  return "/notifications";
}

export function issueStatusNotificationTitle(status: "REPORTED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED") {
  if (status === "IN_PROGRESS") {
    return "Your issue is now in progress.";
  }
  if (status === "RESOLVED") {
    return "Your issue has been resolved.";
  }
  if (status === "CLOSED") {
    return "Your issue has been closed.";
  }
  return "Your issue was marked as reported.";
}
