import { requireAdminContext } from "@/lib/auth/guards";
import { PageHeader } from "@/components/layout/page-header";
import { AnnouncementForm } from "@/components/announcements/announcement-form";

export default async function NewAnnouncementPage() {
  const { building } = await requireAdminContext();

  return (
    <>
      <PageHeader
        title="New announcement"
        description={`This will be published to residents of ${building.name}.`}
      />
      <AnnouncementForm cancelHref="/admin/announcements" />
    </>
  );
}
