import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireResidentContext } from "@/lib/auth/guards";
import { getVoteForUser } from "@/lib/votes/service";
import { isAppError } from "@/lib/errors";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FlashNotice } from "@/components/ui/flash-notice";
import { VoteStatusBadge } from "@/components/votes/vote-status-badge";
import { VoteResults } from "@/components/votes/vote-results";
import { CastVoteForm } from "@/components/votes/cast-vote-form";
import { formatDateTime } from "@/lib/utils";

export default async function ResidentVoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { ctx } = await requireResidentContext();
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
            {formatDateTime(vote.startsAt)} – {formatDateTime(vote.endsAt)}
          </p>
        </div>
        <p className="whitespace-pre-wrap text-base leading-8">{vote.description}</p>
        <p className="text-sm text-muted">
          {vote.responseCount} of {vote.eligibleCount} residents have voted.
        </p>
        {vote.canCast ? <CastVoteForm voteId={vote.id} options={vote.options} /> : null}
        {vote.myOptionLabel && !vote.showResults ? (
          <p className="rounded-lg bg-card-muted px-4 py-3 text-sm">
            You voted for <span className="font-medium">{vote.myOptionLabel}</span>. Results will appear when this vote
            closes.
          </p>
        ) : null}
        {vote.status === "UPCOMING" ? (
          <p className="text-sm text-muted">Voting opens {formatDateTime(vote.startsAt)}.</p>
        ) : null}
        {vote.showResults ? (
          <div>
            <p className="mb-3 text-sm font-medium">Results</p>
            <VoteResults
              options={vote.options.map((option) => ({
                id: option.id,
                label: option.label,
                count: option.count ?? 0,
              }))}
              total={vote.responseCount}
            />
            {vote.myOptionLabel ? (
              <p className="mt-3 text-sm text-muted">
                You voted for <span className="font-medium text-foreground">{vote.myOptionLabel}</span>.
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted">You did not vote in this poll.</p>
            )}
          </div>
        ) : null}
      </Card>
    </>
  );
}
