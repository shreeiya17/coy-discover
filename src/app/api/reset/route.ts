import { NextResponse } from "next/server";
import { resetDemo } from "@/lib/swipe";

export function POST() {
  resetDemo();
  return NextResponse.json({ ok: true });
}