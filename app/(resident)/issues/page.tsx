import { Suspense } from "react";
import { requireResidentContext } from "@/lib/auth/guards";
import { listResidentIssues } from "@/lib/issues/service";
import { ISSUE_STATUSES } from "@/lib/validations/issues";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashNotice } from "@/components/ui/flash-notice";
import { ButtonLink } from "@/components/ui/button";
import { IssueFilters } from "@/components/issues/issue-filters";
import { IssueListItem } from "@/components/issues/issue-list-item";
import type { IssueStatus } from "@/generated/prisma/enums";

export default async function ResidentIssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const selected = ISSUE_STATUSES.includes(status as IssueStatus)
    ? (status as IssueStatus)
    : undefined;
  const { ctx, building } = await requireResidentContext();
  const issues = await listResidentIssues(ctx, building.id, selected);

  return (
    <>
      <Suspense>
        <FlashNotice />
      </Suspense>
      <PageHeader
        title="My issues"
        description="Problems you have reported in this building."
        action={<ButtonLink href="/issues/new">Report a problem</ButtonLink>}
      />
      <IssueFilters basePath="/issues" current={selected} />
      {issues.length === 0 ? (
        <EmptyState
          title={selected ? "No issues match this filter." : "You haven't reported any issues."}
          description={
            selected
              ? "Try another status or report a new problem."
              : "Report a problem if something in the building needs attention."
          }
          action={<ButtonLink href="/issues/new">Report a problem</ButtonLink>}
        />
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <IssueListItem
              key={issue.id}
              href={`/issues/${issue.id}`}
              title={issue.title}
              category={issue.category}
              status={issue.status}
              createdAt={issue.createdAt}
            />
          ))}
        </div>
      )}
    </>
  );
}
