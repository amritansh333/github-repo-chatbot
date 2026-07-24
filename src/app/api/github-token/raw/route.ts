import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decryptToken } from "@/lib/encryption";

// This route returns the raw (decrypted) GitHub token to the authenticated user's
// browser so the client-side GitHub SDK can make API calls directly.
// The token is only ever returned to the session owner over HTTPS.
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
    return NextResponse.json({ token: null });
  }

  try {
    const token = await decryptToken(user.githubAccessToken);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ token: null });
  }
}
