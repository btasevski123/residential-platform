import { notFound } from "next/navigation";
import { requireResidentContext } from "@/lib/auth/guards";
import { getDocumentForUser } from "@/lib/documents/service";
import { isAppError } from "@/lib/errors";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { DocumentCategoryBadge } from "@/components/documents/document-category-badge";
import { formatDateTime, formatFileSize } from "@/lib/utils";

export default async function ResidentDocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { ctx } = await requireResidentContext();
  const document = await getDocumentForUser(ctx, id).catch((error) => {
    if (isAppError(error)) {
      notFound();
    }
    throw error;
  });

  const size = formatFileSize(document.sizeBytes);

  return (
    <>
      <PageHeader
        title={document.title}
        description={document.building.name}
        action={
          document.downloadable ? (
            <ButtonLink href={document.fileUrl} size="sm">
              Download
            </ButtonLink>
          ) : undefined
        }
      />
      <Card className="max-w-3xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <DocumentCategoryBadge category={document.category} />
          <p className="text-sm text-muted">{formatDateTime(document.createdAt)}</p>
        </div>
        {document.description ? (
          <p className="whitespace-pre-wrap text-base leading-8">{document.description}</p>
        ) : null}
        <p className="text-sm text-muted">
          {document.fileName}
          {size ? ` · ${size}` : ""}
        </p>
        {!document.downloadable ? (
          <p className="text-sm text-muted">This file is not available to download yet.</p>
        ) : null}
      </Card>
    </>
  );
}
