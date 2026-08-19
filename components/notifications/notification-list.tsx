"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markNotificationReadAction } from "@/lib/notifications/actions";
import {
  notificationHref,
  notificationTypeLabel,
  type NotificationRecord,
} from "@/lib/notifications/presentation";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { ViewerKind } from "@/lib/navigation";

export function NotificationList({
  notifications,
  viewer,
  emptyTitle = "You're all caught up.",
  emptyDescription = "Important announcements and issue updates will appear here.",
}: {
  notifications: NotificationRecord[];
  viewer: ViewerKind;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (notifications.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
        <p className="font-serif text-lg">{emptyTitle}</p>
        <p className="mt-2 text-sm text-muted">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => {
        const href = notificationHref(notification, viewer);
        const unread = !notification.readAt;

        return (
          <Link
            key={notification.id}
            href={href}
            className={cn(
              "block rounded-xl border px-4 py-3 transition-colors",
              unread ? "border-accent/20 bg-card" : "border-border bg-card/70",
              pending ? "opacity-80" : "hover:border-accent/30",
            )}
            onClick={() => {
              if (!unread) {
                return;
              }
              startTransition(async () => {
                await markNotificationReadAction(notification.id);
                router.refresh();
              });
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>
                  {notification.title}
                </p>
                <p className="mt-0.5 text-xs text-muted">{notificationTypeLabel(notification)}</p>
                {notification.body ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{notification.body}</p>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted">{formatRelativeTime(notification.createdAt)}</p>
                {unread ? <span className="mt-2 inline-block h-2 w-2 rounded-full bg-accent" /> : null}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
