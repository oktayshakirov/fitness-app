import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import release from "../src/content/bundled.json";
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
test("every bundled poster and H.264 video matches its published checksum and dimensions", () => {
  for (const e of release.exercises)
    for (const view of Object.values(e.media.male)) {
      assert.ok(!view.video.path.includes("hevc"));
      for (const asset of [view.poster, view.video]) {
        const bytes = readFileSync(
          new URL("../assets/content/" + asset.path, import.meta.url),
        );
        assert.equal(bytes.length, asset.bytes);
        assert.equal(
          createHash("sha256").update(bytes).digest("hex"),
          asset.sha256,
        );
        assert.ok(asset.width > 0 && asset.height > 0);
      }
    }
});
