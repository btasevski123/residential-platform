import { AppShell } from "@/components/layout/app-shell";
import { requireAdminContext } from "@/lib/auth/guards";
import { getAppShellProps } from "@/lib/layout/shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { ctx, building } = await requireAdminContext();
  const shell = await getAppShellProps(ctx);

  return (
    <AppShell user={ctx.user} eyebrow={`Admin · ${building.name}`} {...shell}>
      {children}
    </AppShell>
  );
}
