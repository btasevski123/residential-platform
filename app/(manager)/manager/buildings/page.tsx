import { requireManagerContext } from "@/lib/auth/guards";
import { getManagerDashboard } from "@/lib/db/dashboards";
import { PageHeader } from "@/components/layout/page-header";
import { BuildingCard } from "@/components/buildings/building-card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ManagerBuildingsPage() {
  const { ctx } = await requireManagerContext();
  const data = await getManagerDashboard(ctx);

  return (
    <>
      <PageHeader title="Buildings" description="Every building in the management company portfolio." />
      {data.buildings.length === 0 ? (
        <EmptyState title="No buildings" description="Buildings you manage will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.buildings.map((building) => (
            <BuildingCard
              key={building.id}
              href={`/manager/buildings/${building.id}`}
              name={building.name}
              address={building.address}
              city={building.city}
              apartments={building.apartments}
              residents={building.residents}
              openIssues={building.openIssues}
            />
          ))}
        </div>
      )}
    </>
  );
}
