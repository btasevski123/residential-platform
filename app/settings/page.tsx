import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requireAccessContext } from "@/lib/auth/guards";
import { getCurrentBuilding, getManagedOrganization } from "@/lib/db/tenant";
import { getAppShellProps } from "@/lib/layout/shell";
import { getViewerKind } from "@/lib/navigation";
import { getVapidPublicKey } from "@/lib/notifications/config";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FlashNotice } from "@/components/ui/flash-notice";
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form";

export default async function SettingsPage() {
  const ctx = await requireAccessContext();
  const viewer = getViewerKind(ctx);
  const shell = await getAppShellProps(ctx);

  let eyebrow = "Settings";
  if (viewer === "manager") {
    const organization = await getManagedOrganization(ctx);
    eyebrow = organization?.name ?? "Management";
  } else {
    const building = await getCurrentBuilding(ctx);
    eyebrow =
      viewer === "admin" && building ? `Admin · ${building.name}` : (building?.name ?? eyebrow);
  }

  return (
    <AppShell user={ctx.user} eyebrow={eyebrow} {...shell}>
      <Suspense>
        <FlashNotice />
      </Suspense>
      <PageHeader
        title="Notification settings"
        description="The in-app inbox always keeps a copy. These channels are extra reach when you are not signed in."
      />
      <Card className="max-w-xl">
        <NotificationPreferencesForm
          emailEnabled={ctx.user.emailNotificationsEnabled}
          pushEnabled={ctx.user.pushNotificationsEnabled}
          pushAvailable={Boolean(getVapidPublicKey())}
          returnTo="/settings"
        />
      </Card>
    </AppShell>
  );
}
