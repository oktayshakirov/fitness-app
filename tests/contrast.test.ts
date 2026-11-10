import test from "node:test";
import assert from "node:assert/strict";
import { palettes } from "../src/palettes";

type RGB = [number, number, number];
/** Parses #RRGGBB or rgba(r,g,b,a) into sRGB 0-1 and alpha. */
function parse(c: string): { rgb: RGB; a: number } {
  if (c.startsWith("#")) {
    const n = (i: number) => parseInt(c.slice(i, i + 2), 16) / 255;
    return { rgb: [n(1), n(3), n(5)], a: 1 };
  }
  const [r = 0, g = 0, b = 0, a = 1] = c.replace(/[^\d.,]/g, "").split(",").map(Number);
  return { rgb: [r / 255, g / 255, b / 255], a };
}
function over(fg: string, bg: string): RGB {
  const f = parse(fg);
  const b = parse(bg).rgb;
  return f.rgb.map((v, i) => v * f.a + b[i]! * (1 - f.a)) as RGB;
}
function luminance([r, g, b]: RGB) {
  const l = (x: number) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return 0.2126 * l(r) + 0.7152 * l(g) + 0.0722 * l(b);
}
function ratio(fg: string, bg: string) {
  const a = luminance(over(fg, bg));
  const b = luminance(parse(bg).rgb);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

for (const [scheme, colors] of Object.entries(palettes)) {
  // surface3 is only a pressed state.
  const backgrounds = { bg: colors.bg, surface: colors.surface, surface2: colors.surface2 };

  test(`${scheme}: text colours meet WCAG AA (4.5:1) on every background`, () => {
    for (const fg of ["text", "secondary", "accentInk", "trained", "recovering", "almost", "ready"] as const) {
      for (const [name, bg] of Object.entries(backgrounds)) {
        const r = ratio(colors[fg], bg);
        assert.ok(r >= 4.5, `${fg} on ${name} is ${r.toFixed(2)}:1`);
      }
    }
    assert.ok(ratio(colors.onAccent, colors.accent) >= 4.5, "onAccent on accent");
  });

  test(`${scheme}: icons on recovery colours and chart bars stay visible (3:1)`, () => {
    for (const state of ["trained", "recovering", "almost", "ready"] as const) {
      const r = ratio(colors.onState, colors[state]);
      assert.ok(r >= 3, `onState on ${state} is ${r.toFixed(2)}:1`);
    }
    assert.ok(ratio(colors.chartPast, colors.surface) >= 3, "past bars");
    assert.ok(ratio(colors.chartPastSelected, colors.surface) >= 3, "selected past bar");
  });
}
