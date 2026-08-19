import { requireResidentContext } from "@/lib/auth/guards";
import { listVotesForBuilding } from "@/lib/votes/service";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { VoteListItem } from "@/components/votes/vote-list-item";

export default async function ResidentVotingPage() {
  const { ctx, building } = await requireResidentContext();
  const votes = await listVotesForBuilding(ctx, building.id);

  return (
    <>
      <PageHeader title="Voting" description={`Official polls for ${building.name}. One vote per person.`} />
      {votes.length === 0 ? (
        <EmptyState
          title="No votes yet"
          description="When the building opens a poll, it will appear here."
        />
      ) : (
        <div className="space-y-3">
          {votes.map((vote) => (
            <VoteListItem
              key={vote.id}
              href={`/voting/${vote.id}`}
              title={vote.title}
              description={vote.description}
              status={vote.status}
              startsAt={vote.startsAt}
              endsAt={vote.endsAt}
              responseCount={vote.responseCount}
              hasVoted={vote.hasVoted}
            />
          ))}
        </div>
      )}
    </>
  );
}
