import { notFound } from "next/navigation";
import { requireResidentContext } from "@/lib/auth/guards";
import { getAnnouncementForUser } from "@/lib/announcements/service";
import { isAppError } from "@/lib/errors";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { PriorityBadge } from "@/components/announcements/priority-badge";
import { displayName, formatDateTime, cn } from "@/lib/utils";

export default async function ResidentAnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { ctx } = await requireResidentContext();
  const announcement = await getAnnouncementForUser(ctx, id).catch((error) => {
    if (isAppError(error)) {
      notFound();
    }
    throw error;
  });

  const highlight =
    announcement.priority === "URGENT"
      ? "border-l-4 border-l-danger"
      : announcement.priority === "IMPORTANT"
        ? "border-l-4 border-l-warning"
        : "";

  return (
    <>
      <PageHeader title={announcement.title} description={announcement.building.name} />
      <Card className={cn("max-w-3xl space-y-4", highlight)}>
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={announcement.priority} />
          <p className="text-sm text-muted">
            {displayName(announcement.author)} · {formatDateTime(announcement.publishedAt ?? announcement.createdAt)}
          </p>
        </div>
        <p className="whitespace-pre-wrap text-base leading-8">{announcement.content}</p>
      </Card>
    </>
  );
}
