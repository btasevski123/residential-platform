import Link from "next/link";
import { LogIn } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" className="font-serif text-xl tracking-tight">
          {APP_NAME}
        </Link>
        <Link
          href="/login"
          className="inline-flex h-11 min-h-11 w-11 items-center justify-center rounded-md text-accent hover:bg-card-muted"
          aria-label="Sign in"
          title="Sign in"
        >
          <LogIn className="h-5 w-5" />
        </Link>
      </header>
      {children}
    </div>
  );
}
