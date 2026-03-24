import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    user: {
      id: session.userId,
      email: session.email,
      phone: session.phone,
    },
  });
}
