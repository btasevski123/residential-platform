import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdminContext } from "@/lib/auth/guards";
import { getVoteForUser } from "@/lib/votes/service";
import { isAppError } from "@/lib/errors";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FlashNotice } from "@/components/ui/flash-notice";
import { VoteStatusBadge } from "@/components/votes/vote-status-badge";
import { VoteResults } from "@/components/votes/vote-results";
import { displayName, formatDateTime } from "@/lib/utils";

export default async function AdminVoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { ctx } = await requireAdminContext();
  const vote = await getVoteForUser(ctx, id).catch((error) => {
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
      <PageHeader title={vote.title} description={vote.building.name} />
      <Card className="max-w-3xl space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <VoteStatusBadge status={vote.status} />
          <p className="text-sm text-muted">
            {displayName(vote.createdBy)} · {formatDateTime(vote.startsAt)} – {formatDateTime(vote.endsAt)}
          </p>
        </div>
        <p className="whitespace-pre-wrap text-base leading-8">{vote.description}</p>
        <div>
          <p className="mb-3 text-sm font-medium">
            Results · {vote.responseCount} of {vote.eligibleCount} residents
          </p>
          <VoteResults
            options={vote.options.map((option) => ({
              id: option.id,
              label: option.label,
              count: option.count ?? 0,
            }))}
            total={vote.responseCount}
          />
        </div>
      </Card>
    </>
  );
}
