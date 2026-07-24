import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { encryptToken, decryptToken } from "@/lib/encryption";
import { validateToken } from "@/lib/github";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { githubAccessToken: true },
  });

  if (!user?.githubAccessToken) {
    return NextResponse.json({ hasToken: false });
  }

  try {
    const token = await decryptToken(user.githubAccessToken);
    // Return masked token for display
    const masked = `${token.slice(0, 7)}${"•".repeat(16)}${token.slice(-4)}`;
    return NextResponse.json({ hasToken: true, masked });
  } catch {
    return NextResponse.json({ hasToken: false });
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = (body as Record<string, unknown>)?.token;
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  // Validate the token against GitHub before storing
  let githubUser;
  try {
    githubUser = await validateToken(token.trim());
  } catch {
    return NextResponse.json(
      { error: "Invalid GitHub token — please check and try again." },
      { status: 422 }
    );
  }

  // Encrypt and store
  const encrypted = await encryptToken(token.trim());
  await db
    .update(users)
    .set({ githubAccessToken: encrypted })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({
    success: true,
    login: githubUser.login,
    avatar: githubUser.avatar_url,
  });
}

export async function DELETE(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db
    .update(users)
    .set({ githubAccessToken: null })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}
