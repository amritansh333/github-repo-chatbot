"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  LogOut, Shield, Trash2, ExternalLink, User, Cpu, Eye, EyeOff,
  Check, Loader2, Download, AlertTriangle, KeyRound,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SaveState = "idle" | "saving" | "saved" | "error";

function useSaveState() {
  const [state, setState] = React.useState<SaveState>("idle");
  const trigger = React.useCallback(async (fn: () => Promise<void>) => {
    setState("saving");
    try {
      await fn();
      setState("saved");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }, []);
  return { state, trigger };
}

// ── GitHub PAT Section ────────────────────────────────────────────────────

function GitHubTokenSection() {
  const [status, setStatus] = React.useState<"loading" | "set" | "none">("loading");
  const [masked, setMasked] = React.useState<string | null>(null);
  const [token, setToken] = React.useState("");
  const [show, setShow] = React.useState(false);
  const { state, trigger } = useSaveState();

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/github-token");
        const data = await res.json() as { hasToken: boolean; masked?: string };
        setStatus(data.hasToken ? "set" : "none");
        setMasked(data.masked ?? null);
      } catch {
        setStatus("none");
      }
    })();
  }, []);

  const handleSave = () =>
    trigger(async () => {
      const res = await fetch("/api/github-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? "Failed");
      }
      const data = await res.json() as { masked?: string };
      setStatus("set");
      setMasked(data.masked ?? null);
      setToken("");
    });

  const handleRemove = () =>
    trigger(async () => {
      await fetch("/api/github-token", { method: "DELETE" });
      setStatus("none");
      setMasked(null);
    });

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-[var(--muted-foreground)]" />
        <h3 className="text-sm font-semibold text-[var(--foreground)]">GitHub Access Token</h3>
      </div>
      <div className="p-6 space-y-4">
        {status === "loading" ? (
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : status === "set" ? (
          <>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)]">
              <Check className="h-4 w-4 text-green-500 shrink-0" />
              <code className="font-mono text-xs text-[var(--muted-foreground)] flex-1 truncate">
                {masked}
              </code>
              <Badge variant="secondary" className="text-xs shrink-0">Active</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStatus("none")}>Replace token</Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-600 border-red-200 hover:border-red-300"
                onClick={handleRemove}
                disabled={state === "saving"}
              >
                {state === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Remove
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="pr-10 font-mono text-sm"
                onKeyDown={(e) => e.key === "Enter" && void handleSave()}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                aria-label={show ? "Hide token" : "Show token"}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {state === "error" && (
              <p className="text-xs text-red-500">Invalid token — please check and try again.</p>
            )}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={!token.trim() || state === "saving"}>
                {state === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {state === "saved" ? "Saved!" : "Save token"}
              </Button>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=RepoChat"
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" /> Generate on GitHub
              </a>
            </div>
          </>
        )}
        <p className="text-xs text-[var(--muted-foreground)]">
          Your token is encrypted with AES-256-GCM and stored server-side. It is never sent to the browser except to make GitHub API calls.
        </p>
      </div>
    </section>
  );
}

// ── AI Model Section ──────────────────────────────────────────────────────

function AIModelSection() {
  const [model, setModel] = React.useState("gemini-2.5-flash");
  const { state, trigger } = useSaveState();

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/user/settings");
        const data = await res.json() as { aiModel?: string };
        if (data.aiModel) setModel(data.aiModel);
      } catch { /* non-fatal */ }
    })();
  }, []);

  const handleChange = (value: string) => {
    setModel(value);
    trigger(async () => {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiModel: value }),
      });
      if (!res.ok) throw new Error("Failed");
    });
  };

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2">
        <Cpu className="h-4 w-4 text-[var(--muted-foreground)]" />
        <h3 className="text-sm font-semibold text-[var(--foreground)]">AI Model</h3>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Select value={model} onValueChange={handleChange}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-2.5-flash">
                Gemini 2.5 Flash — Fast &amp; efficient
              </SelectItem>
              <SelectItem value="gemini-2.5-pro">
                Gemini 2.5 Pro — More capable
              </SelectItem>
            </SelectContent>
          </Select>
          {state === "saving" && <Loader2 className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />}
          {state === "saved" && <Check className="h-4 w-4 text-green-500" />}
          {state === "error" && <span className="text-xs text-red-500">Failed to save</span>}
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
          All AI responses are powered by Google Gemini. The model preference is saved to your account.
        </p>
      </div>
    </section>
  );
}

// ── Profile Section ───────────────────────────────────────────────────────

function ProfileSection() {
  const { data: session, update } = useSession();
  const [name, setName] = React.useState(session?.user?.name ?? "");
  const { state, trigger } = useSaveState();

  React.useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session?.user?.name]);

  const handleSave = () =>
    trigger(async () => {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed");
      await update({ name });
    });

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2">
        <User className="h-4 w-4 text-[var(--muted-foreground)]" />
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Profile</h3>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={session?.user?.image ?? undefined} alt={session?.user?.name ?? "User"} />
            <AvatarFallback className="text-lg">
              {(session?.user?.name ?? session?.user?.email ?? "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-[var(--foreground)]">{session?.user?.name ?? "—"}</p>
            <p className="text-sm text-[var(--muted-foreground)]">{session?.user?.email}</p>
          </div>
        </div>
        <div className="space-y-3 max-w-sm">
          <div>
            <label className="text-xs font-medium text-[var(--foreground)] block mb-1.5">Display name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={100} />
          </div>
          <Button size="sm" onClick={handleSave} disabled={state === "saving"}>
            {state === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {state === "saved" ? <><Check className="h-3.5 w-3.5" /> Saved</> : "Save changes"}
          </Button>
          {state === "error" && <p className="text-xs text-red-500">Failed to save</p>}
        </div>
      </div>
    </section>
  );
}

// ── Danger Zone ───────────────────────────────────────────────────────────

function DangerZone() {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);
  const [confirm, setConfirm] = React.useState("");
  const [exporting, setExporting] = React.useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/user/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "repochat-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm !== "delete my account") return;
    setDeleting(true);
    try {
      await fetch("/api/user", { method: "DELETE" });
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleting(false);
    }
  };

  return (
    <section className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/10 overflow-hidden">
      <div className="px-6 py-4 border-b border-red-200 dark:border-red-900/40">
        <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Danger zone
        </h3>
      </div>
      <div className="p-6 space-y-6">
        {/* Export */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">Export account data</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Download all your conversations, messages, and settings as JSON.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="shrink-0 gap-1.5">
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Export data
          </Button>
        </div>

        <Separator />

        {/* Sign out */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">Sign out</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Sign out of your account on this device.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })} className="shrink-0 gap-1.5">
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>

        <Separator />

        {/* Delete account */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">Delete account</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Permanently delete your account and all data. This cannot be undone.</p>
          </div>
          <div className="space-y-2 max-w-sm">
            <label className="text-xs text-[var(--muted-foreground)]">
              Type <strong>delete my account</strong> to confirm
            </label>
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="delete my account"
              className="text-sm"
            />
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={confirm !== "delete my account" || deleting}
            className="gap-1.5"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete account permanently
          </Button>
        </div>
      </div>
    </section>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Settings</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Manage your account, integrations, and preferences.
        </p>
      </div>

      <ProfileSection />
      <GitHubTokenSection />
      <AIModelSection />

      <Separator />

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2">
          <Shield className="h-4 w-4 text-[var(--muted-foreground)]" />
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Security</h3>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {[
            { label: "Gemini API key", value: "Stored server-side only" },
            { label: "GitHub token", value: "AES-256-GCM encrypted in database" },
            { label: "OAuth tokens", value: "Managed by NextAuth" },
            { label: "Session", value: "Database-backed, HTTP-only cookie" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-6 py-3">
              <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
              <span className="text-xs font-medium text-[var(--foreground)]">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <DangerZone />
    </div>
  );
}
