import { notFound } from "next/navigation";
import { requireAdminContext } from "@/lib/auth/guards";
import { getAnnouncementForUser } from "@/lib/announcements/service";
import { isAppError } from "@/lib/errors";
import { PageHeader } from "@/components/layout/page-header";
import { AnnouncementForm } from "@/components/announcements/announcement-form";

export default async function EditAnnouncementPage({
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

  return (
    <>
      <PageHeader title="Edit announcement" description={announcement.building.name} />
      <AnnouncementForm
        cancelHref={`/admin/announcements/${announcement.id}`}
        announcement={announcement}
      />
    </>
  );
}
