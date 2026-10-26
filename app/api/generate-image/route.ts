import { NextRequest, NextResponse } from "next/server";
import { generateImage, type Fmt } from "@/lib/ai/image";

export const dynamic = "force-dynamic";

// Returns a ready-to-load image URL (Pollinations) built from the idea + goal +
// brand palette. The brand palette is a list of hex strings the client extracted
// from the company's reference image; the reference image itself is never sent.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const idea = String(body.idea || "").trim();
  const goal = String(body.goal || "dia");
  const fmt = (["feed", "story", "reels"].includes(body.fmt) ? body.fmt : "feed") as Fmt;
  const tone = String(body.tone || "vendedor");
  const palette: string[] = Array.isArray(body.palette)
    ? body.palette.filter((h: unknown) => typeof h === "string" && /^#[0-9a-fA-F]{6}$/.test(h)).slice(0, 6)
    : [];
  if (!idea) return NextResponse.json({ error: "missing idea" }, { status: 400 });

  const result = generateImage(idea, goal, palette, fmt, tone);
  return NextResponse.json(result);
}
