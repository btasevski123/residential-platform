import { Badge } from "@/components/ui/badge";
import type { AnnouncementPriority } from "@/generated/prisma/enums";

const variants = {
  NORMAL: "default",
  IMPORTANT: "warning",
  URGENT: "danger",
} as const;

export function PriorityBadge({ priority }: { priority: AnnouncementPriority }) {
  return <Badge variant={variants[priority]}>{priority.toLowerCase()}</Badge>;
}
