"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "This email is already linked to a different sign-in method.",
  OAuthCallbackError: "OAuth sign-in failed. Please try again.",
  CredentialsSignin: "Invalid email or password.",
  Default: "Something went wrong. Please try again.",
};

export function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const errorParam = searchParams.get("error");

  const [oauthLoading, setOauthLoading] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [credLoading, setCredLoading] = React.useState(false);
  const [credError, setCredError] = React.useState<string | null>(null);
  const [magicSent, setMagicSent] = React.useState(false);
  const [magicLoading, setMagicLoading] = React.useState(false);

  const errorMessage = errorParam
    ? (ERROR_MESSAGES[errorParam] ?? ERROR_MESSAGES.Default)
    : null;

  const handleOAuth = async (provider: string) => {
    setOauthLoading(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setOauthLoading(null);
    }
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredLoading(true);
    setCredError(null);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });
      if (result?.error) {
        setCredError(ERROR_MESSAGES.CredentialsSignin);
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch {
      setCredError(ERROR_MESSAGES.Default);
    } finally {
      setCredLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setMagicLoading(true);
    try {
      await signIn("nodemailer", { email, callbackUrl, redirect: false });
      setMagicSent(true);
    } catch {
      setCredError("Failed to send magic link. Please try again.");
    } finally {
      setMagicLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* OAuth error */}
      {(errorMessage || credError) && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{errorMessage ?? credError}</span>
        </div>
      )}

      {/* GitHub OAuth */}
      <Button
        variant="outline"
        className="w-full gap-2 h-11"
        onClick={() => handleOAuth("github")}
        disabled={!!oauthLoading}
        aria-busy={oauthLoading === "github"}
      >
        {oauthLoading === "github" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
        )}
        Continue with GitHub
      </Button>

      {/* Google OAuth */}
      <Button
        variant="outline"
        className="w-full gap-2 h-11"
        onClick={() => handleOAuth("google")}
        disabled={!!oauthLoading}
        aria-busy={oauthLoading === "google"}
      >
        {oauthLoading === "google" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[var(--background)] px-2 text-[var(--muted-foreground)]">
            Or
          </span>
        </div>
      </div>

      {/* Magic link / email */}
      {magicSent ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
          <Mail className="h-8 w-8 text-violet-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-[var(--foreground)]">
            Check your inbox
          </p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            We sent a magic link to <strong>{email}</strong>
          </p>
        </div>
      ) : (
        <form onSubmit={handleMagicLink} className="space-y-3">
          <div>
            <label
              htmlFor="email"
              className="text-xs font-medium text-[var(--foreground)] block mb-1.5"
            >
              Email address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            className="w-full gap-2 h-11"
            disabled={magicLoading || !email}
          >
            {magicLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Continue with Email
          </Button>
        </form>
      )}
    </div>
  );
}
