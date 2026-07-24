import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/db";
import { users, conversations, messages, repositoryPreferences, userSettings } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [user, convRows, repoRows, settings] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, name: true, email: true, image: true, createdAt: true, updatedAt: true },
    }),
    db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt)),
    db
      .select()
      .from(repositoryPreferences)
      .where(eq(repositoryPreferences.userId, userId)),
    db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    }),
  ]);

  // Fetch messages for each conversation
  const convIds = convRows.map((c) => c.id);
  const allMessages =
    convIds.length > 0
      ? await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, convIds[0]))
          .orderBy(asc(messages.createdAt))
      : [];

  const exportData = {
    exportedAt: new Date().toISOString(),
    user,
    settings: settings ?? null,
    conversations: convRows.map((c) => ({
      ...c,
      messages: allMessages.filter((m) => m.conversationId === c.id),
    })),
    repositoryPreferences: repoRows,
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="repochat-export-${userId}.json"`,
    },
  });
}
