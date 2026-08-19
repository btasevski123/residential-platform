import { redirect } from "next/navigation";
import { getAccessContext } from "@/lib/auth/current-user";
import { getDefaultHomePath } from "@/lib/permissions";
import { LoginForm } from "@/app/(public)/login/login-form";

export default async function LoginPage() {
  const ctx = await getAccessContext();
  if (ctx) {
    redirect(getDefaultHomePath(ctx));
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-12 px-4 pb-16 lg:grid-cols-2">
      <div className="hidden lg:block">
        <p className="text-sm uppercase tracking-[0.2em] text-accent">Demo access</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight">
          One platform. Three roles. Five buildings.
        </h1>
        <p className="mt-4 max-w-md text-muted">
          Sign in as a manager, building admin, or resident. Each account is scoped to the
          buildings that person actually belongs to.
        </p>
      </div>
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-serif text-2xl">Sign in</h2>
        <p className="mt-2 text-sm text-muted">Use one of the seeded demo accounts.</p>
        <LoginForm />
      </div>
    </main>
  );
}
