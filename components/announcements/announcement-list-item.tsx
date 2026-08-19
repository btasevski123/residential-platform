import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { PriorityBadge } from "@/components/announcements/priority-badge";
import { cn, formatDate } from "@/lib/utils";
import type { AnnouncementPriority } from "@/generated/prisma/enums";

const accent = {
  NORMAL: "",
  IMPORTANT: "border-l-4 border-l-warning",
  URGENT: "border-l-4 border-l-danger",
} as const;

export function AnnouncementListItem({
  href,
  title,
  content,
  priority,
  date,
  meta,
  published,
}: {
  href: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  date: Date;
  meta?: string;
  published?: boolean;
}) {
  return (
    <Link href={href} className="block">
      <Card className={cn("transition-colors hover:border-accent/30", accent[priority])}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium">{title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{content}</p>
            <p className="mt-2 text-xs text-muted">
              {meta ? `${meta} · ` : ""}
              {formatDate(date)}
              {published === false ? " · Draft" : published ? " · Published" : ""}
            </p>
          </div>
          <PriorityBadge priority={priority} />
        </div>
      </Card>
    </Link>
  );
}

export function FeaturedAnnouncement({
  href,
  title,
  content,
  priority,
  date,
}: {
  href: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  date: Date;
}) {
  return (
    <Card className={cn("space-y-4", accent[priority])}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Important announcement</p>
          <h2 className="mt-1 font-serif text-2xl tracking-tight">{title}</h2>
        </div>
        <PriorityBadge priority={priority} />
      </div>
      <p className="line-clamp-3 text-sm leading-6 text-muted">{content}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">{formatDate(date)}</p>
        <ButtonLink href={href} size="sm">
          Read announcement
        </ButtonLink>
      </div>
    </Card>
  );
}
