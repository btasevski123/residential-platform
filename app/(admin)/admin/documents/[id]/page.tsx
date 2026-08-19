import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdminContext } from "@/lib/auth/guards";
import { getDocumentForUser } from "@/lib/documents/service";
import { isAppError } from "@/lib/errors";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FlashNotice } from "@/components/ui/flash-notice";
import { ButtonLink } from "@/components/ui/button";
import { DocumentCategoryBadge } from "@/components/documents/document-category-badge";
import { DeleteDocumentButton } from "@/components/documents/delete-document-button";
import { displayName, formatDateTime, formatFileSize } from "@/lib/utils";

export default async function AdminDocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { ctx } = await requireAdminContext();
  const document = await getDocumentForUser(ctx, id).catch((error) => {
    if (isAppError(error)) {
      notFound();
    }
    throw error;
  });

  const size = formatFileSize(document.sizeBytes);

  return (
    <>
      <Suspense>
        <FlashNotice />
      </Suspense>
      <PageHeader
        title={document.title}
        description={document.building.name}
        action={
          <div className="flex flex-wrap gap-2">
            {document.downloadable ? (
              <ButtonLink href={document.fileUrl} variant="secondary" size="sm">
                Download
              </ButtonLink>
            ) : null}
            <DeleteDocumentButton documentId={document.id} title={document.title} />
          </div>
        }
      />
      <Card className="max-w-3xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <DocumentCategoryBadge category={document.category} />
          <p className="text-sm text-muted">
            {displayName(document.uploadedBy)} · {formatDateTime(document.createdAt)}
          </p>
        </div>
        {document.description ? (
          <p className="whitespace-pre-wrap text-base leading-8">{document.description}</p>
        ) : null}
        <p className="text-sm text-muted">
          {document.fileName}
          {size ? ` · ${size}` : ""}
        </p>
        {!document.downloadable ? (
          <p className="text-sm text-muted">This file is not stored on the server. Upload a new copy to make it downloadable.</p>
        ) : null}
      </Card>
    </>
  );
}
