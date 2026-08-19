import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdminContext } from "@/lib/auth/guards";
import { getIssueForUser } from "@/lib/issues/service";
import { isAppError } from "@/lib/errors";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { FlashNotice } from "@/components/ui/flash-notice";
import { StatusBadge } from "@/components/issues/status-badge";
import { IssueStatusForm } from "@/components/issues/issue-status-form";
import { IssueHistory } from "@/components/issues/issue-history";
import { displayName, formatDateTime, formatEnumLabel } from "@/lib/utils";

export default async function AdminIssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { ctx } = await requireAdminContext();
  const issue = await getIssueForUser(ctx, id).catch((error) => {
    if (isAppError(error)) {
      notFound();
    }
    throw error;
  });

  return (
    <>
      <Suspense>
        <FlashNotice />
      </Suspense>
      <PageHeader title={issue.title} description={issue.building.name} />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={issue.status} />
            <span className="text-sm text-muted">{formatEnumLabel(issue.category)}</span>
          </div>
          <p className="text-sm text-muted">
            {displayName(issue.reporter)}
            {issue.apartment ? ` · Apt. ${issue.apartment.number}` : ""}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-7">{issue.description}</p>
          {issue.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={issue.imageUrl}
              alt={issue.title}
              className="max-h-96 w-full rounded-lg border border-border object-cover"
            />
          ) : null}
          <p className="text-xs text-muted">
            Created {formatDateTime(issue.createdAt)} · Updated {formatDateTime(issue.updatedAt)}
          </p>
        </Card>
        <div className="space-y-4">
          <IssueStatusForm issueId={issue.id} status={issue.status} />
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <IssueHistory entries={issue.statusHistory} />
          </Card>
        </div>
      </div>
    </>
  );
}
