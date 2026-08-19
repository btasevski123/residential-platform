import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

export default function AdminVotingPage() {
  return (
    <>
      <PageHeader title="Voting" description="Create polls for this building." />
      <ComingSoon title="No active votes." description="Vote creation is coming soon. Existing vote records stay in the database." />
    </>
  );
}
