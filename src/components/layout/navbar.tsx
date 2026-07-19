import * as React from "react";
import { Bell } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavbarProps {
  title?: string;
}

export function Navbar({ title = "Dashboard" }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60 px-4 gap-4">
      {/* Mobile menu trigger */}
      <MobileSidebar />

      {/* Page title */}
      <h1 className="text-sm font-semibold text-[var(--foreground)] flex-1">
        {title}
      </h1>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <div className="relative">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
          >
            3
          </Badge>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
