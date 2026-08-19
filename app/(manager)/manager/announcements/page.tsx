import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

export default function ManagerAnnouncementsPage() {
  return (
    <>
      <PageHeader title="Announcements" description="Portfolio-wide publishing comes later." />
      <ComingSoon
        title="No announcements here yet."
        description="Open a building to review its news. Cross-building publishing is coming soon."
      />
    </>
  );
}
