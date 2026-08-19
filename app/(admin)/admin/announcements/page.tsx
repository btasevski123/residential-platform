import { Suspense } from "react";
import { requireAdminContext } from "@/lib/auth/guards";
import { listManagedAnnouncements } from "@/lib/announcements/service";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashNotice } from "@/components/ui/flash-notice";
import { ButtonLink } from "@/components/ui/button";
import { AnnouncementListItem } from "@/components/announcements/announcement-list-item";
import { displayName } from "@/lib/utils";

export default async function AdminAnnouncementsPage() {
  const { ctx, building } = await requireAdminContext();
  const announcements = await listManagedAnnouncements(ctx, building.id);

  return (
    <>
      <Suspense>
        <FlashNotice />
      </Suspense>
      <PageHeader
        title="Announcements"
        description={`Publish news for ${building.name}. Important and urgent posts notify residents.`}
        action={<ButtonLink href="/admin/announcements/new">Create announcement</ButtonLink>}
      />
      {announcements.length === 0 ? (
        <EmptyState
          title="No announcements yet"
          description="Publish the first update for this building."
          action={<ButtonLink href="/admin/announcements/new">Create announcement</ButtonLink>}
        />
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <AnnouncementListItem
              key={item.id}
              href={`/admin/announcements/${item.id}`}
              title={item.title}
              content={item.content}
              priority={item.priority}
              date={item.publishedAt ?? item.createdAt}
              meta={displayName(item.author)}
              published={Boolean(item.publishedAt)}
            />
          ))}
        </div>
      )}
    </>
  );
}
