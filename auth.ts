import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "./src/db";
import { users, accounts, sessions, verificationTokens } from "./src/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      authorization: { params: { scope: "read:user user:email repo" } },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          !credentials?.email ||
          !credentials?.password ||
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        });
        if (!user?.githubAccessToken) return null;

        const isValid = await bcrypt.compare(credentials.password, user.githubAccessToken);
        if (!isValid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) session.user.id = user.id;
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "github" && account.access_token && user.id) {
        try {
          const { encryptToken } = await import("./src/lib/encryption");
          const encrypted = await encryptToken(account.access_token);
          await db.update(users).set({ githubAccessToken: encrypted }).where(eq(users.id, user.id));
        } catch { /* non-fatal */ }
      }
      return true;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
