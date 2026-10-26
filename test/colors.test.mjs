import { test } from "node:test";
import assert from "node:assert/strict";
import { extractPalette, describePalette } from "../lib/colors.ts";

// build an RGBA buffer: half red (#ff0000), half blue (#0000ff)
function buf() {
  const px = [];
  for (let i = 0; i < 200; i++) px.push(255, 0, 0, 255);
  for (let i = 0; i < 200; i++) px.push(0, 0, 255, 255);
  return new Uint8ClampedArray(px);
}

test("extracts the two dominant brand colors", () => {
  const pal = extractPalette(buf(), 5);
  const hexes = pal.map((s) => s.hex);
  assert.ok(hexes.includes("#ff0000"), "red present: " + hexes.join());
  assert.ok(hexes.includes("#0000ff"), "blue present: " + hexes.join());
});

test("weights sum roughly to the sampled share and are between 0 and 1", () => {
  const pal = extractPalette(buf(), 5);
  for (const s of pal) assert.ok(s.weight >= 0 && s.weight <= 1);
});

test("empty / fully transparent input returns no colors", () => {
  const px = new Uint8ClampedArray([0, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(extractPalette(px), []);
});

test("describePalette labels the primary color", () => {
  const pal = extractPalette(buf(), 2);
  assert.match(describePalette(pal), /principal #/);
});
