"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth";
import { useAuth } from "@/hooks/use-auth";

interface NavbarProps {
  title?: string;
}

export function Navbar({ title = "Dashboard" }: NavbarProps) {
  const { user } = useAuthStore();
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60 px-4 gap-4">
      <MobileSidebar />

      <h1 className="text-sm font-semibold text-[var(--foreground)] flex-1 truncate">
        {title}
      </h1>

      <div className="flex items-center gap-1">
        <ThemeToggle />

        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-[var(--border)] ml-1">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.avatar_url} alt={user.login} />
              <AvatarFallback className="text-xs">
                {user.login.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-xs font-medium text-[var(--foreground)] max-w-24 truncate">
              {user.login}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
              className="h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
