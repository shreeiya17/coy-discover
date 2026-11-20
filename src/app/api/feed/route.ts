import { connection, NextResponse } from "next/server";
import { getFeed } from "@/lib/swipe";

export async function GET() {
  await connection(); // always render per request, never at build time
  return NextResponse.json({ profiles: getFeed() });
}