import { requireResidentContext } from "@/lib/auth/guards";
import { getResidentDashboard } from "@/lib/db/dashboards";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { QuickAction } from "@/components/ui/quick-action";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/issues/status-badge";
import { VoteStatusBadge } from "@/components/votes/vote-status-badge";
import { DocumentCategoryBadge } from "@/components/documents/document-category-badge";
import { FeaturedAnnouncement } from "@/components/announcements/announcement-list-item";
import { formatDateTime, formatRelativeTime, greetingForNow } from "@/lib/utils";
import Link from "next/link";

export default async function ResidentDashboardPage() {
  const { ctx, building } = await requireResidentContext();
  const data = await getResidentDashboard(ctx, building.id);

  if (!data) {
    return (
      <EmptyState
        title="Building unavailable"
        description="Your building context could not be loaded."
      />
    );
  }

  const apartmentLabel = data.apartment ? `Apartment ${data.apartment.number}` : null;

  return (
    <>
      <PageHeader
        title={`${greetingForNow()}, ${ctx.user.firstName}`}
        description={`${data.building.name}${apartmentLabel ? ` · ${apartmentLabel}` : ""}`}
      />

      <section className="mb-6">
        {data.featuredAnnouncement ? (
          <FeaturedAnnouncement
            href={`/announcements/${data.featuredAnnouncement.id}`}
            title={data.featuredAnnouncement.title}
            content={data.featuredAnnouncement.content}
            priority={data.featuredAnnouncement.priority}
            date={data.featuredAnnouncement.publishedAt ?? data.featuredAnnouncement.createdAt}
          />
        ) : (
          <EmptyState
            title="No announcements yet"
            description="When the building publishes important news, it will appear here."
          />
        )}
      </section>

      <section className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>My issues</CardTitle>
            <ButtonLink href="/issues" variant="ghost" size="sm">
              View all issues
            </ButtonLink>
          </CardHeader>
          {data.recentIssues.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-8"
              title="You haven't reported any issues."
              description="Use Report a problem if something in the building needs attention."
              action={
                <ButtonLink href="/issues/new" size="sm">
                  Report a problem
                </ButtonLink>
              }
            />
          ) : (
            <div className="space-y-3">
              {data.recentIssues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/issues/${issue.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-card-muted px-4 py-3"
                >
                  <p className="font-medium">{issue.title}</p>
                  <StatusBadge status={issue.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </section>

      {data.openVotes.length > 0 ? (
        <section className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Open votes</CardTitle>
              <ButtonLink href="/voting" variant="ghost" size="sm">
                View all votes
              </ButtonLink>
            </CardHeader>
            <div className="space-y-3">
              {data.openVotes.map((vote) => (
                <Link
                  key={vote.id}
                  href={`/voting/${vote.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-card-muted px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{vote.title}</p>
                    <p className="text-xs text-muted">
                      Closes {formatDateTime(vote.endsAt)}
                      {vote.responses.length > 0 ? " · You voted" : ""}
                    </p>
                  </div>
                  <VoteStatusBadge status="OPEN" />
                </Link>
              ))}
            </div>
          </Card>
        </section>
      ) : null}

      {data.recentDocuments.length > 0 ? (
        <section className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <ButtonLink href="/documents" variant="ghost" size="sm">
                View all files
              </ButtonLink>
            </CardHeader>
            <div className="space-y-3">
              {data.recentDocuments.map((document) => (
                <Link
                  key={document.id}
                  href={`/documents/${document.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-card-muted px-4 py-3"
                >
                  <p className="font-medium">{document.title}</p>
                  <DocumentCategoryBadge category={document.category} />
                </Link>
              ))}
            </div>
          </Card>
        </section>
      ) : null}

      <section className="mb-6">
        <h2 className="mb-3 font-serif text-lg">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction href="/issues/new" title="Report a problem" description="Tell the building team what needs fixing." />
          <QuickAction href="/announcements" title="Announcements" description="Read the latest building news." />
          <QuickAction href="/notifications" title="Notifications" description="Open your inbox." />
          <QuickAction href="/voting" title="Voting" description="Cast one vote per poll." />
          <QuickAction href="/documents" title="Documents" description="House rules and files." />
        </div>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <Link href="/notifications" className="text-sm text-accent">
              Inbox
            </Link>
          </CardHeader>
          {data.notifications.length === 0 ? (
            <p className="text-sm text-muted">You are all caught up.</p>
          ) : (
            <div className="space-y-3">
              {data.notifications.map((item) => (
                <div key={item.id}>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted">{formatRelativeTime(item.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </>
  );
}
