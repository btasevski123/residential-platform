import { requireResidentContext } from "@/lib/auth/guards";
import { PageHeader } from "@/components/layout/page-header";
import { IssueForm } from "@/components/issues/issue-form";

export default async function NewIssuePage() {
  const { building } = await requireResidentContext();

  return (
    <>
      <PageHeader
        title="Report a problem"
        description={`This will be sent to the team for ${building.name}. Your name and apartment are attached automatically.`}
      />
      <IssueForm />
    </>
  );
}
