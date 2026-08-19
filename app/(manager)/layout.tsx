import { AppShell } from "@/components/layout/app-shell";
import { requireManagerContext } from "@/lib/auth/guards";
import { getManagedOrganization } from "@/lib/db/tenant";
import { getAppShellProps } from "@/lib/layout/shell";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { ctx } = await requireManagerContext();
  const organization = await getManagedOrganization(ctx);
  const shell = await getAppShellProps(ctx);

  return (
    <AppShell user={ctx.user} eyebrow={organization?.name ?? "Management"} {...shell}>
      {children}
    </AppShell>
  );
}
