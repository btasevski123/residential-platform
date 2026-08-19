import {
  canAccessAdminConsole,
  canAccessManagerConsole,
  canAccessResidentApp,
} from "@/lib/permissions";
import type { AccessContext } from "@/types/auth";

export type ViewerKind = "resident" | "admin" | "manager";

export type NavItem = {
  href: string;
  label: string;
};

export const residentNav: NavItem[] = [
  { href: "/dashboard", label: "Home" },
  { href: "/announcements", label: "News" },
  { href: "/issues", label: "Issues" },
  { href: "/notifications", label: "Inbox" },
  { href: "/profile", label: "More" },
];

export const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/residents", label: "Residents" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/issues", label: "Issues" },
  { href: "/admin/voting", label: "Voting" },
  { href: "/admin/documents", label: "Documents" },
];

export const adminMobileNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Home" },
  { href: "/admin/announcements", label: "News" },
  { href: "/admin/issues", label: "Issues" },
  { href: "/admin/residents", label: "People" },
  { href: "/notifications", label: "Inbox" },
];

export const managerNav: NavItem[] = [
  { href: "/manager/dashboard", label: "Dashboard" },
  { href: "/manager/buildings", label: "Buildings" },
  { href: "/manager/residents", label: "Residents" },
  { href: "/manager/issues", label: "Issues" },
  { href: "/manager/announcements", label: "Announcements" },
];

export const managerMobileNav: NavItem[] = [
  { href: "/manager/dashboard", label: "Home" },
  { href: "/manager/buildings", label: "Buildings" },
  { href: "/manager/residents", label: "People" },
  { href: "/manager/issues", label: "Issues" },
  { href: "/notifications", label: "Inbox" },
];

export function getViewerKind(ctx: AccessContext): ViewerKind {
  if (canAccessManagerConsole(ctx)) {
    return "manager";
  }
  if (canAccessAdminConsole(ctx)) {
    return "admin";
  }
  if (canAccessResidentApp(ctx)) {
    return "resident";
  }

  return "resident";
}

export function navForViewer(kind: ViewerKind) {
  if (kind === "manager") {
    return { nav: managerNav, mobileNav: managerMobileNav, variant: "staff" as const };
  }
  if (kind === "admin") {
    return { nav: adminNav, mobileNav: adminMobileNav, variant: "staff" as const };
  }
  return { nav: residentNav, mobileNav: residentNav, variant: "resident" as const };
}
