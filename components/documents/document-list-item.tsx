import Link from "next/link";
import { Card } from "@/components/ui/card";
import { DocumentCategoryBadge } from "@/components/documents/document-category-badge";
import { formatDate, formatFileSize } from "@/lib/utils";
import type { DocumentCategory } from "@/generated/prisma/enums";

export function DocumentListItem({
  href,
  title,
  description,
  category,
  fileName,
  sizeBytes,
  createdAt,
}: {
  href: string;
  title: string;
  description?: string | null;
  category: DocumentCategory;
  fileName: string;
  sizeBytes?: number | null;
  createdAt: Date;
}) {
  const size = formatFileSize(sizeBytes);

  return (
    <Link href={href} className="block">
      <Card className="transition-colors hover:border-accent/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium">{title}</p>
            {description ? <p className="mt-1 line-clamp-2 text-sm text-muted">{description}</p> : null}
            <p className="mt-2 text-xs text-muted">
              {fileName}
              {size ? ` · ${size}` : ""}
              {` · ${formatDate(createdAt)}`}
            </p>
          </div>
          <DocumentCategoryBadge category={category} />
        </div>
      </Card>
    </Link>
  );
}
