import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdminContext } from "@/lib/auth/guards";
import { getAnnouncementForUser } from "@/lib/announcements/service";
import { isAppError } from "@/lib/errors";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FlashNotice } from "@/components/ui/flash-notice";
import { PriorityBadge } from "@/components/announcements/priority-badge";
import { DeleteAnnouncementButton } from "@/components/announcements/delete-announcement-button";
import { ButtonLink } from "@/components/ui/button";
import { displayName, formatDateTime, cn } from "@/lib/utils";

export default async function AdminAnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { ctx } = await requireAdminContext();
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
      <Suspense>
        <FlashNotice />
      </Suspense>
      <PageHeader
        title={announcement.title}
        description={announcement.building.name}
        action={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/admin/announcements/${announcement.id}/edit`} variant="secondary" size="sm">
              Edit
            </ButtonLink>
            <DeleteAnnouncementButton announcementId={announcement.id} title={announcement.title} />
          </div>
        }
      />
      <Card className={cn("max-w-3xl space-y-4", highlight)}>
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={announcement.priority} />
          <p className="text-sm text-muted">
            {announcement.publishedAt ? "Published" : "Draft"} · {displayName(announcement.author)} ·{" "}
            {formatDateTime(announcement.publishedAt ?? announcement.createdAt)}
          </p>
        </div>
        <p className="whitespace-pre-wrap text-base leading-8">{announcement.content}</p>
      </Card>
    </>
  );
}
