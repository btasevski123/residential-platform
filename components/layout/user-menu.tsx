import { displayName } from "@/lib/utils";
import { logout } from "@/lib/auth/actions";
import { Avatar } from "@/components/ui/avatar";
import type { User } from "@/generated/prisma/client";

export function UserMenu({ user }: { user: User }) {
  return (
    <form action={logout} className="flex items-center gap-2 sm:gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium">{displayName(user)}</p>
        <p className="text-xs text-muted">{user.email}</p>
      </div>
      <Avatar name={user} imageUrl={user.imageUrl} />
      <button type="submit" className="min-h-11 px-2 text-sm text-muted hover:text-foreground">
        Sign out
      </button>
    </form>
  );
}
