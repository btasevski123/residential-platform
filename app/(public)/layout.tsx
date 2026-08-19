import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" className="font-serif text-xl tracking-tight">
          {APP_NAME}
        </Link>
        <Link href="/login" className="text-sm font-medium text-accent hover:text-accent-hover">
          Sign in
        </Link>
      </header>
      {children}
    </div>
  );
}
