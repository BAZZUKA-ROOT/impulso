// Brand palette extraction from an uploaded reference image.
//
// This is pure color analysis — NO AI, no cost, deterministic. It quantizes the
// image's pixels into buckets and returns the most frequent, visually distinct
// colors. The result is the brand's palette; it is NEVER the image itself. The
// generator reuses only these colors, so the company's look is kept without ever
// reproducing the reference image.

export interface Swatch {
  hex: string;
  rgb: [number, number, number];
  weight: number; // share of pixels (0..1)
}

function toHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
}

function luminance([r, g, b]: [number, number, number]): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function dist(a: [number, number, number], b: [number, number, number]): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

/**
 * Extract up to `count` distinct brand colors from RGBA pixel data.
 * `pixels` is a flat RGBA array (length multiple of 4), as from canvas getImageData.
 */
export function extractPalette(pixels: Uint8ClampedArray | number[], count = 5): Swatch[] {
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
  let total = 0;
  const step = 4; // every pixel
  for (let i = 0; i + 3 < pixels.length; i += step * 4) {
    const a = pixels[i + 3];
    if (a < 125) continue; // skip transparent
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    // quantize to 5 bits per channel to merge near-identical colors
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const cur = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0 };
    cur.r += r; cur.g += g; cur.b += b; cur.n += 1;
    buckets.set(key, cur);
    total++;
  }
  if (total === 0) return [];

  let cands = [...buckets.values()]
    .map((c) => ({ rgb: [Math.round(c.r / c.n), Math.round(c.g / c.n), Math.round(c.b / c.n)] as [number, number, number], n: c.n }))
    .sort((a, b) => b.n - a.n);

  // Drop near-greys only if we have enough colorful candidates (keep brand neutrals otherwise)
  const colorful = cands.filter((c) => {
    const mx = Math.max(...c.rgb), mn = Math.min(...c.rgb);
    return mx - mn > 18;
  });
  if (colorful.length >= count) cands = colorful;

  // Greedily pick distinct colors (reject ones too close to an already-picked one)
  const picked: { rgb: [number, number, number]; n: number }[] = [];
  for (const c of cands) {
    if (picked.every((p) => dist(p.rgb, c.rgb) > 48)) picked.push(c);
    if (picked.length >= count) break;
  }
  // if we rejected too many, backfill from the top
  for (const c of cands) {
    if (picked.length >= count) break;
    if (!picked.includes(c)) picked.push(c);
  }

  return picked.map((p) => ({ hex: toHex(...p.rgb), rgb: p.rgb, weight: +(p.n / total).toFixed(3) }))
    .sort((a, b) => luminance(b.rgb) - luminance(a.rgb)); // light -> dark, stable order
}

/** Human-friendly role labels for the first few swatches (primary/secondary/…). */
export function describePalette(sw: Swatch[]): string {
  if (!sw.length) return "nenhuma cor detectada";
  const roles = ["principal", "secundária", "destaque", "apoio", "neutra"];
  return sw.map((s, i) => `${roles[i] || "cor"} ${s.hex}`).join(", ");
}
