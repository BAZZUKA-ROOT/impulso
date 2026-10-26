// Image generation adapter (free, no API key) via Pollinations.
//
// buildImagePrompt() is pure and unit-tested. It turns the idea + goal + brand
// palette into a prompt that GUIDES the model to use the company's colors and
// visual style, while explicitly telling it to create an ORIGINAL composition
// and NOT reproduce any reference image. The reference image never leaves the
// user's device as an image — only its extracted hex palette is sent here.
//
// Honest note: diffusion models approximate prompt colors; results stay close to
// the brand palette but are not pixel-exact. Swap this adapter for a paid image
// API later without touching the rest of the app.

export type Fmt = "feed" | "story" | "reels";

const GOAL_STYLE: Record<string, string> = {
  promo: "bold promotional poster, energetic, sale vibe",
  novo: "sleek product launch poster, premium, clean",
  dia: "friendly daily social post, warm, inviting",
  evento: "event announcement poster, lively, celebratory",
  dica: "clean tip/infographic style, minimal, informative",
};

export function dimsFor(fmt: Fmt): { width: number; height: number } {
  if (fmt === "story" || fmt === "reels") return { width: 720, height: 1280 };
  return { width: 1024, height: 1024 };
}

/**
 * Build the text prompt for the image model.
 * palette: array of hex strings extracted from the brand's reference image.
 */
export function buildImagePrompt(
  idea: string,
  goal: string,
  palette: string[],
  tone = "vendedor"
): string {
  const style = GOAL_STYLE[goal] || "modern marketing social media post";
  const colorClause = palette.length
    ? `strictly use this brand color palette: ${palette.join(", ")}. Keep these exact colors dominant throughout.`
    : "modern, cohesive color palette";
  const toneWord = { vendedor: "persuasive", casual: "casual", profissional: "professional", divertido: "playful" }[tone] || "modern";
  return [
    `${style}, ${toneWord} mood`,
    `theme: ${idea}`,
    colorClause,
    "flat vector / modern graphic design, high quality, clean composition, social-media ready",
    // guardrails: original work, not a copy of any reference
    "original artwork, do not copy any existing logo or photo, no watermark, no gibberish text",
  ].join(". ");
}

export interface ImageResult {
  url: string;       // a URL the client can load directly, or a data URL after proxy
  provider: string;
  prompt: string;
}

/**
 * Returns a Pollinations image URL for the built prompt. Pollinations serves the
 * generated PNG directly from this URL (no key required). The caller can use the
 * URL in an <img>, or fetch+proxy it server-side.
 */
export function pollinationsImageUrl(prompt: string, fmt: Fmt, seed?: number): string {
  const { width, height } = dimsFor(fmt);
  const s = seed ?? Math.floor(Math.random() * 1e6);
  const base = "https://image.pollinations.ai/prompt/";
  const q = new URLSearchParams({ width: String(width), height: String(height), seed: String(s), nologo: "true" });
  return base + encodeURIComponent(prompt) + "?" + q.toString();
}

export function generateImage(idea: string, goal: string, palette: string[], fmt: Fmt, tone?: string): ImageResult {
  const prompt = buildImagePrompt(idea, goal, palette, tone);
  return { url: pollinationsImageUrl(prompt, fmt), provider: "pollinations", prompt };
}
