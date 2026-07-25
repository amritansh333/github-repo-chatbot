import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "sonner";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: "Chat with any GitHub repository using AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AuthSessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                classNames: {
                  toast:
                    "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-lg",
                  description: "text-[var(--muted-foreground)]",
                  actionButton:
                    "bg-[var(--primary)] text-[var(--primary-foreground)]",
                  cancelButton:
                    "bg-[var(--muted)] text-[var(--muted-foreground)]",
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
