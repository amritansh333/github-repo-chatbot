import {
  LayoutDashboard,
  BarChart3,
  Settings,
  Users,
  FileText,
  Bell,
  type LucideIcon,
} from "lucide-react";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "MyApp";
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
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: FileText,
    badge: "3",
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    badge: "12",
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];
