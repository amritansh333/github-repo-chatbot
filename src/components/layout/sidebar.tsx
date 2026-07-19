"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, APP_NAME } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LayoutGrid } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-[var(--sidebar-width,240px)] shrink-0 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-background)] h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--primary)]">
          <LayoutGrid className="h-4 w-4 text-[var(--primary-foreground)]" />
        </div>
        <span className="font-semibold text-[var(--foreground)] text-sm">
          {APP_NAME}
        </span>
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]"
                      : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Separator />

      {/* Footer */}
      <div className="px-4 py-3">
        <p className="text-xs text-[var(--muted-foreground)]">Sprint 1 — Foundation</p>
      </div>
    </aside>
  );
}
