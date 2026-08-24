import { APP_NAME } from "@/lib/constants";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav, NavLinks } from "@/components/layout/nav-links";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { PushRegistrar } from "@/components/notifications/push-registrar";
import { cn } from "@/lib/utils";
import type { NavItem, ViewerKind } from "@/lib/navigation";
import type { NotificationRecord } from "@/lib/notifications/presentation";
import type { User } from "@/generated/prisma/client";
import Link from "next/link";

export function AppShell({
  user,
  nav,
  mobileNav,
  eyebrow,
  children,
  variant = "staff",
  viewer,
  unreadCount = 0,
  notifications = [],
  pushEnabled = false,
  vapidPublicKey = "",
}: {
  user: User;
  nav: NavItem[];
  mobileNav?: NavItem[];
  eyebrow?: string;
  children: React.ReactNode;
  variant?: "resident" | "staff";
  viewer: ViewerKind;
  unreadCount?: number;
  notifications?: NotificationRecord[];
  pushEnabled?: boolean;
  vapidPublicKey?: string;
}) {
  const bottomNav = mobileNav ?? nav.slice(0, 5);

  return (
    <div className="min-h-full overflow-x-hidden bg-background">
      <PushRegistrar enabled={pushEnabled} vapidPublicKey={vapidPublicKey} />
      <header className="relative z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <Link href="/" className="font-serif text-lg tracking-tight">
              {APP_NAME}
            </Link>
            {eyebrow ? <p className="truncate text-xs text-muted">{eyebrow}</p> : null}
          </div>
          <NavLinks items={nav} className="hidden items-center gap-1 md:flex" />
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
            <NotificationBell unreadCount={unreadCount} preview={notifications} viewer={viewer} />
            <UserMenu user={user} />
          </div>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto max-w-6xl px-4 py-8",
          variant === "resident" || bottomNav.length > 0 ? "pb-24 md:pb-8" : "",
        )}
      >
        {children}
      </main>

      <MobileNav items={bottomNav} />
    </div>
  );
}
