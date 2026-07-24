import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { GitBranch } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";

export const metadata: Metadata = { title: "Sign In" };

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] px-4">
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-md">
          <GitBranch className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight text-[var(--foreground)]">{APP_NAME}</span>
      </Link>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Welcome back</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">Sign in to your account to continue</p>
        </div>
        <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="h-6 w-6 border-2 border-[var(--border)] border-t-violet-500 rounded-full animate-spin" /></div>}>
          <SignInForm />
        </Suspense>
        <p className="text-center text-xs text-[var(--muted-foreground)] mt-6">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-[var(--foreground)] transition-colors">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline hover:text-[var(--foreground)] transition-colors">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
