import "server-only";

import { getShellNotifications } from "@/lib/notifications/service";
import { getVapidPublicKey } from "@/lib/notifications/config";
import { getViewerKind, navForViewer } from "@/lib/navigation";
import type { AccessContext } from "@/types/auth";

export async function getAppShellProps(ctx: AccessContext) {
  const viewer = getViewerKind(ctx);
  const { nav, mobileNav, variant } = navForViewer(viewer);
  const { unreadCount, preview } = await getShellNotifications(ctx);

  return {
    viewer,
    nav,
    mobileNav,
    variant,
    unreadCount,
    notifications: preview,
    pushEnabled: ctx.user.pushNotificationsEnabled,
    vapidPublicKey: getVapidPublicKey(),
  };
}
