"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/navigation";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/admin/dashboard" || href === "/manager/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({
  items,
  className,
  itemClassName,
}: {
  items: NavItem[];
  className?: string;
  itemClassName?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={className}>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm transition-colors",
              active ? "bg-card-muted font-medium text-foreground" : "text-muted hover:bg-card-muted hover:text-foreground",
              itemClassName,
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const columns = items.length >= 5 ? "grid-cols-5" : items.length === 4 ? "grid-cols-4" : "grid-cols-3";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card md:hidden">
      <div className={cn("grid", columns)}>
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 items-center justify-center px-1 text-center text-xs",
                active ? "font-medium text-accent" : "text-muted",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
