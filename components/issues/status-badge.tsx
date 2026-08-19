import { Badge } from "@/components/ui/badge";
import { formatEnumLabel } from "@/lib/utils";
import type { IssueStatus } from "@/generated/prisma/enums";

const variants = {
  REPORTED: "warning",
  IN_PROGRESS: "accent",
  RESOLVED: "success",
  CLOSED: "default",
} as const;

export function StatusBadge({ status }: { status: IssueStatus }) {
  return <Badge variant={variants[status]}>{formatEnumLabel(status)}</Badge>;
}
