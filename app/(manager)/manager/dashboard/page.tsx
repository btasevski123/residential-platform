import { requireManagerContext } from "@/lib/auth/guards";
import { getManagerDashboard } from "@/lib/db/dashboards";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { BuildingCard } from "@/components/buildings/building-card";
import { displayName, formatDateTime, formatEnumLabel } from "@/lib/utils";

export default async function ManagerDashboardPage() {
  const { ctx } = await requireManagerContext();
  const data = await getManagerDashboard(ctx);
  const attention = data.buildings.filter((building) => building.openIssues > 0).length;

  return (
    <>
      <PageHeader
        title="Portfolio"
        description={
          attention > 0
            ? `You manage ${data.totals.buildings} buildings. ${attention} need attention.`
            : `You manage ${data.totals.buildings} buildings. Nothing urgent right now.`
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Buildings" value={data.totals.buildings} />
        <StatCard label="Residents" value={data.totals.residents} />
        <StatCard label="Apartments" value={data.totals.apartments} />
        <StatCard label="Open issues" value={data.totals.openIssues} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <h2 className="mb-3 font-serif text-lg">Buildings</h2>
          {data.buildings.length === 0 ? (
            <EmptyState title="No buildings" description="Buildings you manage will appear here." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          {data.activity.length === 0 ? (
            <p className="text-sm text-muted">No recent activity.</p>
          ) : (
            data.activity.map((item) => (
              <div key={item.id} className="mb-4 last:mb-0">
                <p className="text-sm font-medium">{formatEnumLabel(item.action)}</p>
                <p className="text-xs text-muted">
                  {item.building?.name} · {displayName(item.actor)} · {formatDateTime(item.createdAt)}
                </p>
              </div>
            ))
          )}
        </Card>
      </div>
    </>
  );
}
