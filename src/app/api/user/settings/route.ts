import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const VALID_THEMES = ["light", "dark", "system"] as const;
const VALID_MODELS = ["gemini-2.5-flash", "gemini-2.5-pro"] as const;

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, session.user.id),
  });

  if (!settings) {
    // Create default settings on first access
    [settings] = await db
      .insert(userSettings)
      .values({ userId: session.user.id })
      .returning();
  }

  return NextResponse.json(settings);
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
  const updates: Partial<typeof userSettings.$inferInsert> = {};

  if (typeof b.theme === "string" && (VALID_THEMES as readonly string[]).includes(b.theme)) {
    updates.theme = b.theme;
  }
  if (typeof b.aiModel === "string" && (VALID_MODELS as readonly string[]).includes(b.aiModel)) {
    updates.aiModel = b.aiModel;
  }
  if (typeof b.sidebarOpen === "boolean") {
    updates.sidebarOpen = b.sidebarOpen;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Upsert
  const existing = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, session.user.id),
    columns: { id: true },
  });

  let result;
  if (existing) {
    [result] = await db
      .update(userSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userSettings.userId, session.user.id))
      .returning();
  } else {
    [result] = await db
      .insert(userSettings)
      .values({ userId: session.user.id, ...updates })
      .returning();
  }

  return NextResponse.json(result);
}
