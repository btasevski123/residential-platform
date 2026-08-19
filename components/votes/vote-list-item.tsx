import Link from "next/link";
import { Card } from "@/components/ui/card";
import { VoteStatusBadge } from "@/components/votes/vote-status-badge";
import { formatDateTime } from "@/lib/utils";
import type { VoteLifecycle } from "@/lib/votes/status";

export function VoteListItem({
  href,
  title,
  description,
  status,
  startsAt,
  endsAt,
  responseCount,
  hasVoted,
}: {
  href: string;
  title: string;
  description: string;
  status: VoteLifecycle;
  startsAt: Date;
  endsAt: Date;
  responseCount: number;
  hasVoted?: boolean;
}) {
  const windowLabel =
    status === "UPCOMING"
      ? `Opens ${formatDateTime(startsAt)}`
      : status === "OPEN"
        ? `Closes ${formatDateTime(endsAt)}`
        : `Closed ${formatDateTime(endsAt)}`;

  return (
    <Link href={href} className="block">
      <Card className="transition-colors hover:border-accent/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium">{title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{description}</p>
            <p className="mt-2 text-xs text-muted">
              {windowLabel}
              {` · ${responseCount} vote${responseCount === 1 ? "" : "s"}`}
              {hasVoted ? " · You voted" : ""}
            </p>
          </div>
          <VoteStatusBadge status={status} />
        </div>
      </Card>
    </Link>
  );
}
