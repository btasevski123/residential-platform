import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

export default function ManagerIssuesPage() {
  return (
    <>
      <PageHeader title="Issues" description="Maintenance work across the portfolio." />
      <ComingSoon
        title="Portfolio issue board coming soon."
        description="Open a building to see its live issues. Aggregation across buildings is planned for a later phase."
      />
    </>
  );
}
