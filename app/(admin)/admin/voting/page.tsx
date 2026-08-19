import { Suspense } from "react";
import { requireAdminContext } from "@/lib/auth/guards";
import { listVotesForBuilding } from "@/lib/votes/service";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashNotice } from "@/components/ui/flash-notice";
import { ButtonLink } from "@/components/ui/button";
import { VoteListItem } from "@/components/votes/vote-list-item";

export default async function AdminVotingPage() {
  const { ctx, building } = await requireAdminContext();
  const votes = await listVotesForBuilding(ctx, building.id);

  return (
    <>
      <Suspense>
        <FlashNotice />
      </Suspense>
      <PageHeader
        title="Voting"
        description={`Create polls for ${building.name}. Residents can cast one vote while a poll is open.`}
        action={<ButtonLink href="/admin/voting/new">Create vote</ButtonLink>}
      />
      {votes.length === 0 ? (
        <EmptyState
          title="No votes yet"
          description="Create the first poll for this building."
          action={<ButtonLink href="/admin/voting/new">Create vote</ButtonLink>}
        />
      ) : (
        <div className="space-y-3">
          {votes.map((vote) => (
            <VoteListItem
              key={vote.id}
              href={`/admin/voting/${vote.id}`}
              title={vote.title}
              description={vote.description}
              status={vote.status}
              startsAt={vote.startsAt}
              endsAt={vote.endsAt}
              responseCount={vote.responseCount}
            />
          ))}
        </div>
      )}
    </>
  );
}
