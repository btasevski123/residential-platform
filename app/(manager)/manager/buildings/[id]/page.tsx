import { notFound } from "next/navigation";
import { requireManagerContext } from "@/lib/auth/guards";
import { getBuildingOverview } from "@/lib/db/dashboards";
import { canManageBuilding } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/issues/status-badge";
import { displayName, formatDateTime, formatEnumLabel } from "@/lib/utils";

export default async function ManagerBuildingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { ctx } = await requireManagerContext();
  const data = await getBuildingOverview(ctx, id);

  if (!data || !canManageBuilding(ctx, data.building)) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={data.building.name}
        description={`${data.building.address}, ${data.building.city}`}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Residents</CardTitle>
          </CardHeader>
          {data.residents.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-6" title="No residents yet" />
          ) : (
            <div className="space-y-3">
              {data.residents.map((membership) => (
                <div key={membership.id} className="flex items-start justify-between gap-3 rounded-lg bg-card-muted px-3 py-3">
                  <div>
                    <p className="text-sm font-medium">{displayName(membership.user)}</p>
                    <p className="text-xs text-muted">
                      {membership.apartment ? `Apartment ${membership.apartment.number}` : "No apartment"}
                    </p>
                  </div>
                  <Badge variant={membership.role === "BUILDING_ADMIN" ? "accent" : "default"}>
                    {membership.role === "BUILDING_ADMIN" ? "Admin" : "Resident"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Open issues</CardTitle>
            </CardHeader>
            {data.issues.length === 0 ? (
              <p className="text-sm text-muted">No issues yet.</p>
            ) : (
              data.issues.map((issue) => (
                <div key={issue.id} className="mb-3 flex items-start justify-between gap-3 last:mb-0">
                  <div>
                    <p className="text-sm font-medium">{issue.title}</p>
                    <p className="text-xs text-muted">
                      {formatEnumLabel(issue.category)} · {displayName(issue.reporter)}
                      {issue.apartment ? ` · Apt. ${issue.apartment.number}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={issue.status} />
                </div>
              ))
            )}
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            {data.activity.length === 0 ? (
              <p className="text-sm text-muted">No recent activity.</p>
            ) : (
              data.activity.map((item) => (
                <div key={item.id} className="mb-3 last:mb-0">
                  <p className="text-sm">{formatEnumLabel(item.action)}</p>
                  <p className="text-xs text-muted">
                    {displayName(item.actor)} · {formatDateTime(item.createdAt)}
                  </p>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
