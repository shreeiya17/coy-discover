import { NextResponse } from "next/server";
import { z } from "zod";
import { recordSwipe, SwipeError } from "@/lib/swipe";

const Body = z.object({
  profileId: z.number().int().positive(),
  direction: z.enum(["like", "pass"]),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  try {
    return NextResponse.json(recordSwipe(parsed.data.profileId, parsed.data.direction));
  } catch (e) {
    if (e instanceof SwipeError) return NextResponse.json({ error: e.message }, { status: 404 });
    throw e;
  }
}