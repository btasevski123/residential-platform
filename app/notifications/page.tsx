import { AppShell } from "@/components/layout/app-shell";
import { requireAccessContext } from "@/lib/auth/guards";
import { getCurrentBuilding, getManagedOrganization } from "@/lib/db/tenant";
import { getAppShellProps } from "@/lib/layout/shell";
import { getViewerKind } from "@/lib/navigation";
import { listMyNotifications } from "@/lib/notifications/service";
import { markAllNotificationsReadAction } from "@/lib/notifications/actions";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationList } from "@/components/notifications/notification-list";
import { Button } from "@/components/ui/button";

export default async function NotificationsPage() {
  const ctx = await requireAccessContext();
  const viewer = getViewerKind(ctx);
  const shell = await getAppShellProps(ctx);
  const notifications = await listMyNotifications(ctx);
  const unread = notifications.some((item) => !item.readAt);

  let eyebrow = "Notifications";
  if (viewer === "manager") {
    const organization = await getManagedOrganization(ctx);
    eyebrow = organization?.name ?? "Management";
  } else {
    const building = await getCurrentBuilding(ctx);
    eyebrow = viewer === "admin" && building ? `Admin · ${building.name}` : building?.name ?? eyebrow;
  }

  return (
    <AppShell user={ctx.user} eyebrow={eyebrow} {...shell}>
      <PageHeader
        title="Notifications"
        description="Alerts for announcements and issue updates. Only you can see this inbox."
        action={
          unread ? (
            <form action={markAllNotificationsReadAction}>
              <Button type="submit" variant="secondary">
                Mark all as read
              </Button>
            </form>
          ) : null
        }
      />
      <NotificationList notifications={notifications} viewer={viewer} />
    </AppShell>
  );
}
