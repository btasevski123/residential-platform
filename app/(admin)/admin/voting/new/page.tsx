import { requireAdminContext } from "@/lib/auth/guards";
import { PageHeader } from "@/components/layout/page-header";
import { VoteForm } from "@/components/votes/vote-form";

export default async function NewVotePage() {
  const { building } = await requireAdminContext();

  return (
    <>
      <PageHeader
        title="New vote"
        description={`Residents of ${building.name} will be notified when this poll is created.`}
      />
      <VoteForm cancelHref="/admin/voting" />
    </>
  );
}
