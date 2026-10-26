import { NextRequest, NextResponse } from "next/server";
import { generateCaption } from "@/lib/ai/caption";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const idea = String(body.idea || "").trim();
  const goal = String(body.goal || "dia");
  const tone = String(body.tone || "vendedor");
  if (!idea) return NextResponse.json({ error: "missing idea" }, { status: 400 });
  const result = await generateCaption(idea, goal, tone);
  return NextResponse.json(result);
}
