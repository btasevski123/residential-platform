import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

export default function ResidentVotingPage() {
  return (
    <>
      <PageHeader title="Voting" description="Building votes will live here." />
      <ComingSoon title="No active votes." description="Voting is coming soon. You will be able to cast one vote per poll from this page." />
    </>
  );
}
