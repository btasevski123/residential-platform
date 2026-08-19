import { Suspense } from "react";
import { requireAdminContext } from "@/lib/auth/guards";
import { listManagedIssues } from "@/lib/issues/service";
import { ISSUE_STATUSES } from "@/lib/validations/issues";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashNotice } from "@/components/ui/flash-notice";
import { IssueFilters } from "@/components/issues/issue-filters";
import { IssueListItem } from "@/components/issues/issue-list-item";
import { displayName } from "@/lib/utils";
import type { IssueStatus } from "@/generated/prisma/enums";

export default async function AdminIssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const selected = ISSUE_STATUSES.includes(status as IssueStatus)
    ? (status as IssueStatus)
    : undefined;
  const { ctx, building } = await requireAdminContext();
  const issues = await listManagedIssues(ctx, building.id, selected);

  return (
    <>
      <Suspense>
        <FlashNotice />
      </Suspense>
      <PageHeader
        title="Issues"
        description={`Reports for ${building.name}. Reported and in-progress items are listed first.`}
      />
      <IssueFilters basePath="/admin/issues" current={selected} />
      {issues.length === 0 ? (
        <EmptyState
          title={selected ? "Nothing matches this filter." : "No issues yet"}
          description="Resident reports will appear here when they need attention."
        />
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <IssueListItem
              key={issue.id}
              href={`/admin/issues/${issue.id}`}
              title={issue.title}
              category={issue.category}
              status={issue.status}
              createdAt={issue.createdAt}
              subtitle={`${displayName(issue.reporter)}${issue.apartment ? ` · Apt. ${issue.apartment.number}` : ""}`}
            />
          ))}
        </div>
      )}
    </>
  );
}
