import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.query.conversations.findMany({
    where: eq(conversations.userId, session.user.id),
    orderBy: [desc(conversations.updatedAt)],
    with: {
      messages: {
        orderBy: [desc(messages.createdAt)],
        limit: 1,
        columns: { role: true, content: true, createdAt: true },
      },
    },
    limit: 100,
  });

  return NextResponse.json(rows);
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
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  if (
    !b.title ||
    !b.repoFullName ||
    !b.repoOwner ||
    !b.repoName ||
    !b.repoBranch
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [conv] = await db
    .insert(conversations)
    .values({
      userId: session.user.id,
      title: String(b.title),
      repoFullName: String(b.repoFullName),
      repoOwner: String(b.repoOwner),
      repoName: String(b.repoName),
      repoBranch: String(b.repoBranch),
      repoLanguage: b.repoLanguage ? String(b.repoLanguage) : null,
      repoPrivate: Boolean(b.repoPrivate),
    })
    .returning();

  return NextResponse.json(conv, { status: 201 });
}
