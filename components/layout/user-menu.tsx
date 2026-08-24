import Link from "next/link";
import { displayName } from "@/lib/utils";
import { logout } from "@/lib/auth/actions";
import { Avatar } from "@/components/ui/avatar";
import type { User } from "@/generated/prisma/client";

export function UserMenu({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium">{displayName(user)}</p>
        <p className="text-xs text-muted">{user.email}</p>
      </div>
      <Avatar name={user} imageUrl={user.imageUrl} />
      <Link
        href="/settings"
        className="inline-flex min-h-11 items-center px-2 text-sm text-muted hover:text-foreground"
      >
        Settings
      </Link>
      <form action={logout}>
        <button type="submit" className="min-h-11 px-2 text-sm text-muted hover:text-foreground">
          Sign out
        </button>
      </form>
    </div>
  );
}
