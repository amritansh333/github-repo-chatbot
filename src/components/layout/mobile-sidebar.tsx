"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, APP_NAME } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

export function MobileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // Close on route change
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72 bg-[var(--sidebar-background)]">
        <SheetHeader className="px-4 py-4 border-b border-[var(--sidebar-border)]">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--primary)]">
              <LayoutGrid className="h-4 w-4 text-[var(--primary-foreground)]" />
            </div>
            <span className="font-semibold text-sm">{APP_NAME}</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <SheetClose asChild>
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
                  </SheetClose>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 border-t border-[var(--sidebar-border)]">
          <p className="text-xs text-[var(--muted-foreground)]">Sprint 1 — Foundation</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
