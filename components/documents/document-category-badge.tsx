import { Badge } from "@/components/ui/badge";
import { formatEnumLabel } from "@/lib/utils";
import type { DocumentCategory } from "@/generated/prisma/enums";

export function DocumentCategoryBadge({ category }: { category: DocumentCategory }) {
  return <Badge>{formatEnumLabel(category)}</Badge>;
}
