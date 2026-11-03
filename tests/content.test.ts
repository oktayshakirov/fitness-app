import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import raw from "../src/content/bundled.json";
import hits from "../src/content/hit-regions.json";
import { muscleAt } from "../src/content/hits";
import type { ContentRelease } from "../src/content/types";
const release = raw as ContentRelease;
import { muscleIds } from "../src/content/types";
test("the offline release contains 30 unique exercises and valid muscle references", () => {
  assert.equal(release.exercises.length, 30);
  assert.equal(new Set(release.exercises.map((e) => e.id)).size, 30);
  for (const e of release.exercises) {
    assert.ok(e.steps.length > 0);
    for (const m of [...e.primary, ...e.secondary])
      assert.ok((muscleIds as readonly string[]).includes(m), m);
  }
});
function* assets(node: unknown): Generator<{ path: string; bytes: number; sha256: string; width: number; height: number }> {
  if (node && typeof node === "object") {
    if ("sha256" in node && "path" in node) yield node as never;
    else for (const value of Object.values(node)) yield* assets(value);
  }
}
test("every bundled file (videos, posters, body views, heroes, icons) matches its published checksum", () => {
  let count = 0;
  for (const asset of assets({ ...release, attribution: undefined })) {
    assert.ok(!asset.path.includes("hevc"));
    const bytes = readFileSync(new URL("../assets/content/" + asset.path, import.meta.url));
    assert.equal(bytes.length, asset.bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256);
    assert.ok(asset.width > 0 && asset.height > 0);
    count++;
  }
  assert.ok(count > 400, String(count));
});
test("both models ship every exercise, a front/back body view and a hero", () => {
  for (const model of ["male", "female"] as const) {
    for (const e of release.exercises) assert.ok(e.media[model], `${e.id} ${model}`);
    assert.ok(release.bodymap[model]?.front && release.bodymap[model]?.back);
    assert.ok(release.heroes[model]);
  }
});
test("body hit regions resolve taps to the right muscle", () => {
  const front = release.bodymap.male!.front!;
  const regions = hits[front.hitRegions.path as keyof typeof hits] as Record<string, number[][]>;
  const found = new Set<string>();
  for (let x = 0; x < 800; x += 4)
    for (let y = 0; y < 1000; y += 4) {
      const muscle = muscleAt(front, x, y);
      if (muscle) found.add(muscle);
    }
  assert.deepEqual([...found].sort(), Object.keys(regions).sort());
  assert.equal(muscleAt(front, 0, 0), undefined);
});
