"use client";

import * as React from "react";
import { LogOut, Shield, Trash2, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

export default function SettingsPage() {
  const { logout } = useAuth();
  const { user, token } = useAuthStore();

  const maskedToken = token
    ? `${token.slice(0, 7)}${"•".repeat(16)}${token.slice(-4)}`
    : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
          Settings
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Manage your account and connection settings.
        </p>
      </div>

      {/* GitHub Account */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            GitHub Account
          </h3>
        </div>
        <div className="p-6">
          {user ? (
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={user.avatar_url} alt={user.login} />
                <AvatarFallback className="text-base">
                  {user.login.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[var(--foreground)] truncate">
                    {user.name ?? user.login}
                  </p>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    Connected
                  </Badge>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  @{user.login}
                </p>
                {user.email && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    {user.email}
                  </p>
                )}
              </div>
              <a
                href={user.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Profile
                </Button>
              </a>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              No account connected.
            </p>
          )}
        </div>
      </section>

      {/* Token */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--muted-foreground)]" />
            Personal Access Token
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)]">
            <code className="font-mono text-sm text-[var(--muted-foreground)] truncate">
              {maskedToken ?? "No token stored"}
            </code>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Your token is stored in browser local storage. It is never sent to
            any server other than GitHub&apos;s API.
          </p>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Manage tokens on GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Account info */}
      {user && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Account details
            </h3>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {[
              { label: "Username", value: user.login },
              { label: "Public repos", value: String(user.public_repos) },
              { label: "Followers", value: String(user.followers) },
              { label: "Following", value: String(user.following) },
              {
                label: "Member since",
                value: format(new Date(user.created_at), "MMMM d, yyyy"),
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between px-6 py-3"
              >
                <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Separator />

      {/* Danger zone */}
      <section className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-red-200 dark:border-red-900/40">
          <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Danger zone
          </h3>
        </div>
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              Disconnect account
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Remove your token and sign out. You can reconnect any time.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={logout}
            className="gap-1.5 shrink-0"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </section>
    </div>
  );
}
