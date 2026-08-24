"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { markAllNotificationsReadAction } from "@/lib/notifications/actions";
import { NotificationList } from "@/components/notifications/notification-list";
import { getAnchoredPopoverStyle } from "@/lib/ui/popover-position";
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
  const [style, setStyle] = useState<ReturnType<typeof getAnchoredPopoverStyle> | null>(null);
  const [pending, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      return;
    }

    const update = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      setStyle(getAnchoredPopoverStyle(rect));
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const markAll = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  };

  const panel = (
    <div className="flex min-h-0 flex-1 flex-col p-4">
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
      <div
        className="min-h-0 flex-1 overflow-y-auto"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) {
            setOpen(false);
          }
        }}
      >
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
        ref={buttonRef}
        type="button"
        className="relative inline-flex h-11 min-h-11 w-11 items-center justify-center rounded-md hover:bg-card-muted"
        aria-expanded={open}
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

      {open && style
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close notifications"
                className="fixed inset-0 z-50 cursor-default"
                onClick={() => setOpen(false)}
              />
              <div
                className="fixed z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                style={style}
              >
                {panel}
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
