import { AppShell } from "@/components/layout/app-shell";
import { requireResidentContext } from "@/lib/auth/guards";
import { getAppShellProps } from "@/lib/layout/shell";

export default async function ResidentLayout({ children }: { children: React.ReactNode }) {
  const { ctx, building } = await requireResidentContext();
  const shell = await getAppShellProps(ctx);

  return (
    <AppShell user={ctx.user} eyebrow={building.name} {...shell}>
      {children}
    </AppShell>
  );
}
