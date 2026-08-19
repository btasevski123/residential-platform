import { requireResidentContext } from "@/lib/auth/guards";
import { listDocumentsForBuilding } from "@/lib/documents/service";
import { DOCUMENT_CATEGORIES } from "@/lib/validations/documents";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentFilters } from "@/components/documents/document-filters";
import { DocumentListItem } from "@/components/documents/document-list-item";
import type { DocumentCategory } from "@/generated/prisma/enums";

export default async function ResidentDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const selected = DOCUMENT_CATEGORIES.includes(category as DocumentCategory)
    ? (category as DocumentCategory)
    : undefined;
  const { ctx, building } = await requireResidentContext();
  const documents = await listDocumentsForBuilding(ctx, building.id, selected);

  return (
    <>
      <PageHeader
        title="Documents"
        description={`House rules, minutes, and contracts for ${building.name}.`}
      />
      <DocumentFilters basePath="/documents" current={selected} />
      {documents.length === 0 ? (
        <EmptyState
          title={selected ? "Nothing matches this filter." : "No documents yet"}
          description="When the building shares files, they will appear here."
        />
      ) : (
        <div className="space-y-3">
          {documents.map((document) => (
            <DocumentListItem
              key={document.id}
              href={`/documents/${document.id}`}
              title={document.title}
              description={document.description}
              category={document.category}
              fileName={document.fileName}
              sizeBytes={document.sizeBytes}
              createdAt={document.createdAt}
            />
          ))}
        </div>
      )}
    </>
  );
}
