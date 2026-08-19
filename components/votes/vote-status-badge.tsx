import { Badge } from "@/components/ui/badge";
import type { VoteLifecycle } from "@/lib/votes/status";

const variants = {
  UPCOMING: "default",
  OPEN: "accent",
  CLOSED: "success",
} as const;

const labels = {
  UPCOMING: "Upcoming",
  OPEN: "Open",
  CLOSED: "Closed",
} as const;

export function VoteStatusBadge({ status }: { status: VoteLifecycle }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
