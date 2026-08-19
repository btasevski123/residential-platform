import Link from "next/link";
import { requireAdminContext } from "@/lib/auth/guards";
import { getAdminDashboard } from "@/lib/db/dashboards";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/issues/status-badge";
import { PriorityBadge } from "@/components/announcements/priority-badge";
import { displayName, formatDateTime, formatEnumLabel } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const { ctx, building } = await requireAdminContext();
  const data = await getAdminDashboard(ctx, building.id);

  if (!data) {
    return (
      <EmptyState
        title="No building selected"
        description="This account does not have a manageable building."
      />
    );
  }

  return (
    <>
      <PageHeader
        title={data.building.name}
        description="What needs attention in this building."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Residents" value={data.residentCount} />
        <StatCard label="Open issues" value={data.openIssueCount} />
        <StatCard label="Active votes" value={data.activeVoteCount} />
        <StatCard label="Documents" value={data.documentCount} hint="Coming soon" />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ButtonLink href="/admin/announcements/new">Create announcement</ButtonLink>
        <ButtonLink href="/admin/issues" variant="secondary">
          View issues
        </ButtonLink>
        <ButtonLink href="/admin/voting/new" variant="secondary">
          Create vote
        </ButtonLink>
        <ButtonLink href="/admin/residents" variant="secondary">
          View residents
        </ButtonLink>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent announcements</CardTitle>
            <Link href="/admin/announcements" className="text-sm text-accent">
              Manage
            </Link>
          </CardHeader>
          {data.announcements.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-6"
              title="No announcements yet"
              description="Publish the first update for this building."
            />
          ) : (
            <div className="space-y-3">
              {data.announcements.map((item) => (
                <Link key={item.id} href={`/admin/announcements/${item.id}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted">
                        {item.publishedAt ? "Published" : "Draft"} · {formatDateTime(item.publishedAt ?? item.createdAt)}
                      </p>
                    </div>
                    <PriorityBadge priority={item.priority} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent issues</CardTitle>
            <Link href="/admin/issues" className="text-sm text-accent">
              View all
            </Link>
          </CardHeader>
          {data.recentIssues.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-6"
              title="No issues yet"
              description="Resident reports will appear here."
            />
          ) : (
            <div className="space-y-3">
              {data.recentIssues.map((item) => (
                <Link key={item.id} href={`/admin/issues/${item.id}`} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted">
                      {displayName(item.reporter)}
                      {item.apartment ? ` · Apt. ${item.apartment.number}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          {data.activity.length === 0 ? (
            <p className="text-sm text-muted">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {data.activity.map((item) => (
                <div key={item.id}>
                  <p className="text-sm">{formatEnumLabel(item.action)}</p>
                  <p className="text-xs text-muted">
                    {displayName(item.actor)} · {formatDateTime(item.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
