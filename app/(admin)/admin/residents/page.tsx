import { requireAdminContext } from "@/lib/auth/guards";
import { listBuildingDirectory } from "@/lib/db/dashboards";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { displayName } from "@/lib/utils";

export default async function AdminResidentsPage() {
  const { ctx, building } = await requireAdminContext();
  const data = await listBuildingDirectory(ctx, building.id);

  if (!data) {
    return <EmptyState title="Residents unavailable" description="This building directory could not be loaded." />;
  }

  return (
    <>
      <PageHeader
        title="Residents"
        description={`People in ${data.building.name}. This is a read-only directory.`}
      />
      {data.residents.length === 0 ? (
        <EmptyState title="No residents yet" description="Memberships for this building will appear here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.residents.map((membership) => (
            <Card key={membership.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{displayName(membership.user)}</p>
                <p className="mt-1 text-sm text-muted">
                  {membership.apartment ? `Apartment ${membership.apartment.number}` : "No apartment assigned"}
                </p>
                <p className="mt-1 text-xs text-muted">{membership.user.email}</p>
              </div>
              <Badge variant={membership.role === "BUILDING_ADMIN" ? "accent" : "default"}>
                {membership.role === "BUILDING_ADMIN" ? "Admin" : "Resident"}
              </Badge>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
