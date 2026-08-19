import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-24">
      <section className="grid gap-12 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Residential operations
          </p>
          <h1 className="mt-4 max-w-xl font-serif text-5xl leading-tight tracking-tight sm:text-6xl">
            {APP_TAGLINE}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
            Atrium is built for buildings, house councils, and professional management
            companies. Communication, issues, votes, documents, and operations live in one
            shared system — not a chat thread.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
            >
              Open the demo
            </Link>
            <a
              href="#product"
              className="inline-flex h-12 items-center rounded-md border border-border bg-card px-5 text-sm font-medium"
            >
              See what it covers
            </a>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted">Built around the building</p>
          <div className="mt-5 space-y-3">
            {[
              ["Organization", "House council or management company"],
              ["Building", "The operating unit residents belong to"],
              ["Apartment", "Where residents actually live"],
              ["Membership", "Access is granted, never assumed"],
            ].map(([title, body]) => (
              <div key={title} className="rounded-xl bg-card-muted px-4 py-3">
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="product" className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Announcements", "Publish building news with priority and notifications."],
          ["Issue reporting", "Residents report problems with photos. Staff track status."],
          ["Voting", "Collect resident decisions without pretending they are legally binding yet."],
          ["Documents", "House rules, minutes, contracts, and finances in one place."],
          ["Multi-building", "Management companies run a portfolio from one dashboard."],
          ["Roles that scale", "Resident, building admin, manager, and org admin."],
        ].map(([title, body]) => (
          <article key={title} className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-serif text-xl">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
          </article>
        ))}
      </section>
      <p className="pt-8 text-sm text-muted">
        {APP_NAME} · North Macedonia first, designed to expand.
      </p>
    </main>
  );
}
