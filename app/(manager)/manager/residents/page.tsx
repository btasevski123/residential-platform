import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

export default function ManagerResidentsPage() {
  return (
    <>
      <PageHeader title="Residents" description="People across the buildings you manage." />
      <ComingSoon
        title="Portfolio resident directory coming soon."
        description="Open a building now to see its residents."
      />
    </>
  );
}
