import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/issues/status-badge";
import { formatDate, formatEnumLabel } from "@/lib/utils";
import type { IssueStatus } from "@/generated/prisma/enums";

const accents = {
  REPORTED: "border-l-4 border-l-warning",
  IN_PROGRESS: "border-l-4 border-l-accent",
  RESOLVED: "border-l-4 border-l-success",
  CLOSED: "border-l-4 border-l-border",
} as const;

export function IssueListItem({
  href,
  title,
  category,
  status,
  createdAt,
  subtitle,
}: {
  href: string;
  title: string;
  category: string;
  status: IssueStatus;
  createdAt: Date;
  subtitle?: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className={`transition-colors hover:border-accent/30 ${accents[status]}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium">{title}</p>
            {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
            <p className="mt-2 text-xs text-muted">
              {formatEnumLabel(category)} · {formatDate(createdAt)}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>
      </Card>
    </Link>
  );
}
