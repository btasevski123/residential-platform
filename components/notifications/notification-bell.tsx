"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { markAllNotificationsReadAction } from "@/lib/notifications/actions";
import { NotificationList } from "@/components/notifications/notification-list";
import { Drawer } from "@/components/ui/drawer";
import type { NotificationRecord } from "@/lib/notifications/presentation";
import type { ViewerKind } from "@/lib/navigation";

export function NotificationBell({
  unreadCount,
  preview,
  viewer,
}: {
  unreadCount: number;
  preview: NotificationRecord[];
  viewer: ViewerKind;
}) {
  const [open, setOpen] = useState(false);
  const [desktop, setDesktop] = useState(true);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open || !desktop) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, desktop]);

  const markAll = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  };

  const panel = (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Notifications</p>
        {unreadCount > 0 ? (
          <button
            type="button"
            className="text-xs text-accent disabled:opacity-50"
            disabled={pending}
            onClick={markAll}
          >
            Mark all as read
          </button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <NotificationList
          notifications={preview}
          viewer={viewer}
          emptyTitle="You're all caught up."
          emptyDescription="New alerts will show up here."
        />
      </div>
      <Link
        href="/notifications"
        className="mt-3 block py-2 text-center text-sm text-accent"
        onClick={() => setOpen(false)}
      >
        View all notifications
      </Link>
    </div>
  );

  return (
    <div className="relative">
      <button
        type="button"
        className="relative inline-flex h-11 min-h-11 w-11 items-center justify-center rounded-md hover:bg-card-muted"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-4 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {desktop && open ? (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-40 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-4 shadow-sm">
            {panel}
          </div>
        </>
      ) : null}

      {!desktop ? (
        <Drawer open={open} title="Notifications" onClose={() => setOpen(false)}>
          {panel}
        </Drawer>
      ) : null}
    </div>
  );
}
