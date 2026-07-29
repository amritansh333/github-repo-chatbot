import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { ErrorBoundary } from "@/components/providers/error-boundary";
import { Toaster } from "sonner";
import { APP_NAME } from "@/lib/constants";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://repochat.vercel.app";
const APP_DESCRIPTION = "AI-powered GitHub repository chat. Explore codebases, understand architecture, and get answers using Gemini AI.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Chat with any GitHub repository`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: ["GitHub", "AI", "code chat", "repository", "Gemini", "RAG", "developer tool"],
  authors: [{ name: "RepoChat" }],
  creator: "RepoChat",
  openGraph: {
    type: "website",
    url: APP_URL,
    title: `${APP_NAME} — Chat with any GitHub repository`,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    images: [{ url: `${APP_URL}/og-image.png`, width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Chat with any GitHub repository`,
    description: APP_DESCRIPTION,
    images: [`${APP_URL}/og-image.png`],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AuthSessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <Toaster
              position="bottom-right"
              toastOptions={{
                classNames: {
                  toast: "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-lg",
                  description: "text-[var(--muted-foreground)]",
                  actionButton: "bg-[var(--primary)] text-[var(--primary-foreground)]",
                  cancelButton: "bg-[var(--muted)] text-[var(--muted-foreground)]",
                  error: "border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400",
                  success: "border-green-200 dark:border-green-900/50",
                },
              }}
            />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
