import { test } from "node:test";
import assert from "node:assert/strict";
import { buildImagePrompt, pollinationsImageUrl, dimsFor } from "../lib/ai/image.ts";
import { buildCaptionPrompt, templateCaption } from "../lib/ai/caption.ts";

test("image prompt embeds the brand palette and forbids copying", () => {
  const p = buildImagePrompt("promo de pizza", "promo", ["#ff0000", "#0000ff"], "vendedor");
  assert.ok(p.includes("#ff0000") && p.includes("#0000ff"), "palette in prompt");
  assert.match(p, /do not copy/i, "guardrail against copying");
  assert.match(p, /original artwork/i);
  assert.match(p, /pizza/);
});

test("image prompt works without a palette (falls back to a generic palette clause)", () => {
  const p = buildImagePrompt("novo tênis", "novo", []);
  assert.ok(!p.includes("#"), "no hex when palette empty");
  assert.match(p, /color palette/i);
});

test("story/reels are portrait, feed is square", () => {
  assert.deepEqual(dimsFor("feed"), { width: 1024, height: 1024 });
  assert.deepEqual(dimsFor("story"), { width: 720, height: 1280 });
});

test("pollinations url is a valid https image endpoint carrying the dimensions", () => {
  const url = pollinationsImageUrl("test prompt", "feed", 7);
  assert.match(url, /^https:\/\/image\.pollinations\.ai\/prompt\//);
  assert.match(url, /width=1024/);
  assert.match(url, /seed=7/);
});

test("caption prompt and template are in Portuguese and include hashtags", () => {
  assert.match(buildCaptionPrompt("x", "promo", "casual"), /português/i);
  const cap = templateCaption("promo de pizza", "promo", "vendedor");
  assert.match(cap, /#/);
  assert.match(cap, /Promo de pizza|Promoção/);
});
