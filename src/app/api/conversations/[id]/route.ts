import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, ctx: RouteContext): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const updates: Partial<typeof conversations.$inferInsert> = {};

  if (typeof b.title === "string" && b.title.trim()) {
    updates.title = b.title.trim().slice(0, 200);
  }
  if (typeof b.pinned === "boolean") {
    updates.pinned = b.pinned;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(conversations)
    .set({ ...updates, updatedAt: new Date() })
    .where(
      and(
        eq(conversations.id, id),
        eq(conversations.userId, session.user.id)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const [deleted] = await db
    .delete(conversations)
    .where(
      and(
        eq(conversations.id, id),
        eq(conversations.userId, session.user.id)
      )
    )
    .returning({ id: conversations.id });

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
