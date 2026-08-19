import { requireAdminContext } from "@/lib/auth/guards";
import { PageHeader } from "@/components/layout/page-header";
import { DocumentForm } from "@/components/documents/document-form";

export default async function NewDocumentPage() {
  const { building } = await requireAdminContext();

  return (
    <>
      <PageHeader
        title="Upload document"
        description={`This file will be available to residents of ${building.name}.`}
      />
      <DocumentForm cancelHref="/admin/documents" />
    </>
  );
}
