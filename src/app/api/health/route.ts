import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const hasDbUrl = Boolean(process.env.DATABASE_URL);
  const hasSecret = Boolean(
    process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
  );
  let dbOk = false;
  let userCount = -1;
  let dbError = "";

  try {
    userCount = await prisma.user.count();
    dbOk = true;
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    ok: dbOk && hasSecret,
    hasDbUrl,
    hasSecret,
    dbOk,
    userCount,
    dbError: dbError ? dbError.slice(0, 200) : undefined,
  });
}
