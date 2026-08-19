import { Suspense } from "react";
import { requireAdminContext } from "@/lib/auth/guards";
import { listDocumentsForBuilding } from "@/lib/documents/service";
import { DOCUMENT_CATEGORIES } from "@/lib/validations/documents";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashNotice } from "@/components/ui/flash-notice";
import { ButtonLink } from "@/components/ui/button";
import { DocumentFilters } from "@/components/documents/document-filters";
import { DocumentListItem } from "@/components/documents/document-list-item";
import type { DocumentCategory } from "@/generated/prisma/enums";

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const selected = DOCUMENT_CATEGORIES.includes(category as DocumentCategory)
    ? (category as DocumentCategory)
    : undefined;
  const { ctx, building } = await requireAdminContext();
  const documents = await listDocumentsForBuilding(ctx, building.id, selected);

  return (
    <>
      <Suspense>
        <FlashNotice />
      </Suspense>
      <PageHeader
        title="Documents"
        description={`Files residents of ${building.name} can view and download.`}
        action={<ButtonLink href="/admin/documents/new">Upload document</ButtonLink>}
      />
      <DocumentFilters basePath="/admin/documents" current={selected} />
      {documents.length === 0 ? (
        <EmptyState
          title={selected ? "Nothing matches this filter." : "No documents yet"}
          description="Upload house rules, minutes, contracts, and other building files."
          action={<ButtonLink href="/admin/documents/new">Upload document</ButtonLink>}
        />
      ) : (
        <div className="space-y-3">
          {documents.map((document) => (
            <DocumentListItem
              key={document.id}
              href={`/admin/documents/${document.id}`}
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
