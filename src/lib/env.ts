/**
 * Environment variable validation.
 * Call validateEnv() in server-side code to fail fast on misconfiguration.
 */

interface EnvConfig {
  DATABASE_URL: string;
  AUTH_SECRET: string;
  GEMINI_API_KEY: string;
  AUTH_GITHUB_ID?: string;
  AUTH_GITHUB_SECRET?: string;
  AUTH_GOOGLE_ID?: string;
  AUTH_GOOGLE_SECRET?: string;
  NEXT_PUBLIC_APP_NAME?: string;
  NEXT_PUBLIC_APP_URL?: string;
}

export function validateEnv(): EnvConfig {
  const required = {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  };

  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
      `See .env.example for reference.`
    );
  }

  return {
    DATABASE_URL: required.DATABASE_URL!,
    AUTH_SECRET: required.AUTH_SECRET!,
    GEMINI_API_KEY: required.GEMINI_API_KEY!,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };
}

/** Safe to call on client — returns only public vars */
export const clientEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "RepoChat",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://repochat.vercel.app",
} as const;
