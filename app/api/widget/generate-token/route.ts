import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { widgetToken } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user already has a token
  const existingToken = await db.query.widgetToken.findFirst({
    where: eq(widgetToken.userId, session.user.id),
  });

  if (existingToken) {
    return NextResponse.json({ token: existingToken.token });
  }

  // Generate a new secure random token
  const token = crypto.randomUUID();

  // Create the token in database
  await db.insert(widgetToken).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    token,
  });

  return NextResponse.json({ token });
}

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get existing token if any
  const existingToken = await db.query.widgetToken.findFirst({
    where: eq(widgetToken.userId, session.user.id),
  });

  if (!existingToken) {
    return NextResponse.json({ token: null });
  }

  return NextResponse.json({ token: existingToken.token });
}
