import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { db } from "@/db";
import { users, conversations, messages, repositoryPreferences, userSettings } from "@/db/schema";
import { eq, count } from "drizzle-orm";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      githubAccessToken: false, // never return raw token
    },
    with: {
      userSettings: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Counts for the profile
  const [convCount] = await db
    .select({ value: count() })
    .from(conversations)
    .where(eq(conversations.userId, session.user.id));

  const [repoCount] = await db
    .select({ value: count() })
    .from(repositoryPreferences)
    .where(eq(repositoryPreferences.userId, session.user.id));

  return NextResponse.json({
    ...user,
    stats: {
      conversations: convCount?.value ?? 0,
      repositories: repoCount?.value ?? 0,
    },
  });
}

export async function PATCH(req: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const updates: Partial<typeof users.$inferInsert> = {};

  if (typeof b.name === "string") {
    updates.name = b.name.trim().slice(0, 100) || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, session.user.id))
    .returning({ id: users.id, name: users.name, email: users.email, image: users.image });

  return NextResponse.json(updated);
}

export async function DELETE(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cascade deletes handle related records via FK constraints
  await db.delete(users).where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}
