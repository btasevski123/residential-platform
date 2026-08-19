import Link from "next/link";
import { requireResidentContext } from "@/lib/auth/guards";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { displayName } from "@/lib/utils";

export default async function ProfilePage() {
  const { ctx, building } = await requireResidentContext();
  const membership = ctx.memberships.find((item) => item.buildingId === building.id);

  return (
    <>
      <PageHeader title="More" description="Your account, building, and upcoming tools." />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-3">
          <p>
            <span className="text-muted">Name</span>
            <br />
            {displayName(ctx.user)}
          </p>
          <p>
            <span className="text-muted">Email</span>
            <br />
            {ctx.user.email}
          </p>
          <p>
            <span className="text-muted">Building</span>
            <br />
            {building.name}
          </p>
          {membership?.apartment ? (
            <p>
              <span className="text-muted">Apartment</span>
              <br />
              {membership.apartment.number}
            </p>
          ) : null}
        </Card>
        <Card className="space-y-3">
          <p className="font-medium">More in this building</p>
          <Link href="/voting" className="block rounded-lg bg-card-muted px-4 py-3 text-sm">
            Voting <span className="text-muted">· Coming soon</span>
          </Link>
          <Link href="/documents" className="block rounded-lg bg-card-muted px-4 py-3 text-sm">
            Documents <span className="text-muted">· Coming soon</span>
          </Link>
          <Link href="/notifications" className="block rounded-lg bg-card-muted px-4 py-3 text-sm">
            Notifications
          </Link>
        </Card>
      </div>
    </>
  );
}
