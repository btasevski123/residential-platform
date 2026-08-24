"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { displayName } from "@/lib/utils";
import { logout } from "@/lib/auth/actions";
import { Avatar } from "@/components/ui/avatar";
import { getAnchoredPopoverStyle } from "@/lib/ui/popover-position";
import type { User } from "@/generated/prisma/client";

const headerActionClassName =
  "inline-flex h-11 min-h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-card-muted hover:text-foreground";

export function UserMenu({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-0.5">
      <UserIdentity user={user} />
      <Link href="/settings" className={headerActionClassName} aria-label="Settings" title="Settings">
        <Settings className="h-5 w-5" />
      </Link>
      <form action={logout}>
        <button type="submit" className={headerActionClassName} aria-label="Sign out" title="Sign out">
          <LogOut className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}

function UserIdentity({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [hoverable, setHoverable] = useState(false);
  const [style, setStyle] = useState<ReturnType<typeof getAnchoredPopoverStyle> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const name = displayName(user);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setHoverable(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      return;
    }

    const update = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      setStyle(getAnchoredPopoverStyle(rect, { maxWidth: 288 }));
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

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) {
        return;
      }
      if ((target as HTMLElement).closest?.("[data-user-identity-popover]")) {
        return;
      }
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => {
        if (hoverable) {
          setOpen(true);
        }
      }}
      onMouseLeave={() => {
        if (hoverable) {
          setOpen(false);
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-card-muted"
        aria-expanded={open}
        aria-label={name}
        title={name}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar name={user} imageUrl={user.imageUrl} />
      </button>
      {open && style
        ? createPortal(
            <div
              data-user-identity-popover
              className="fixed z-50 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm"
              style={{ top: style.top, left: style.left, width: style.width }}
            >
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
