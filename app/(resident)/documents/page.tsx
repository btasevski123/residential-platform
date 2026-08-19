import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

export default function ResidentDocumentsPage() {
  return (
    <>
      <PageHeader title="Documents" description="House rules, minutes, and contracts." />
      <ComingSoon
        title="No documents available yet."
        description="The document library is coming soon. Files shared with this building will appear here."
      />
    </>
  );
}
