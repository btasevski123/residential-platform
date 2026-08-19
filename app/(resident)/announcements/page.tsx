import { requireResidentContext } from "@/lib/auth/guards";
import { listPublishedAnnouncements } from "@/lib/announcements/service";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { AnnouncementListItem } from "@/components/announcements/announcement-list-item";
import { displayName } from "@/lib/utils";

export default async function ResidentAnnouncementsPage() {
  const { ctx, building } = await requireResidentContext();
  const announcements = await listPublishedAnnouncements(ctx, building.id);

  return (
    <>
      <PageHeader
        title="Announcements"
        description={`News for ${building.name}, newest first.`}
      />
      {announcements.length === 0 ? (
        <EmptyState
          title="No announcements yet"
          description="When the building publishes news, it will appear here."
        />
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <AnnouncementListItem
              key={item.id}
              href={`/announcements/${item.id}`}
              title={item.title}
              content={item.content}
              priority={item.priority}
              date={item.publishedAt ?? item.createdAt}
              meta={displayName(item.author)}
            />
          ))}
        </div>
      )}
    </>
  );
}
