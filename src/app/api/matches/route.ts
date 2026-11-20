import { connection, NextResponse } from "next/server";
import { getMatches } from "@/lib/swipe";

export async function GET() {
  await connection();
  return NextResponse.json({ matches: getMatches() });
}