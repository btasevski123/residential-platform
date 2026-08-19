import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

export default function AdminDocumentsPage() {
  return (
    <>
      <PageHeader title="Documents" description="Files residents can view and download." />
      <ComingSoon
        title="No documents available yet."
        description="Document upload is coming soon. Existing files stay in the database."
      />
    </>
  );
}
