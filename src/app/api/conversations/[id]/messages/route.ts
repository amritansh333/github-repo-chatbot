import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteContext): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const conv = await db.query.conversations.findFirst({
    where: and(eq(conversations.id, id), eq(conversations.userId, session.user.id)),
    columns: { id: true },
  });

  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await db.query.messages.findMany({
    where: eq(messages.conversationId, id),
    orderBy: [asc(messages.createdAt)],
  });

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, ctx: RouteContext): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const conv = await db.query.conversations.findFirst({
    where: and(eq(conversations.id, id), eq(conversations.userId, session.user.id)),
    columns: { id: true },
  });

  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  // Support batch insert: { messages: [{role, content}] }
  if (Array.isArray(b.messages)) {
    const toInsert = (b.messages as Array<{ role: string; content: string }>).filter(
      (m) => m.role && m.content && ["user", "assistant"].includes(m.role)
    );
    if (toInsert.length === 0) {
      return NextResponse.json({ error: "No valid messages" }, { status: 400 });
    }
    const inserted = await db
      .insert(messages)
      .values(toInsert.map((m) => ({ conversationId: id, role: m.role, content: m.content })))
      .returning();

    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, id));

    return NextResponse.json(inserted, { status: 201 });
  }

  // Single message insert
  if (!b.role || !b.content || typeof b.role !== "string" || typeof b.content !== "string") {
    return NextResponse.json({ error: "role and content are required" }, { status: 400 });
  }
  if (!["user", "assistant"].includes(b.role)) {
    return NextResponse.json({ error: "role must be user or assistant" }, { status: 400 });
  }

  const [msg] = await db
    .insert(messages)
    .values({ conversationId: id, role: b.role, content: b.content })
    .returning();

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, id));

  return NextResponse.json(msg, { status: 201 });
}
