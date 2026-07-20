import {
  LayoutDashboard,
  GitFork,
  Settings,
  type LucideIcon,
} from "lucide-react";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "RepoChat";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Repositories",
    href: "/dashboard/repositories",
    icon: GitFork,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];
