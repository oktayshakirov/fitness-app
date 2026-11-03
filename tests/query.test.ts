import { test } from "node:test";
import assert from "node:assert/strict";
import raw from "../src/content/bundled.json";
import type { ContentRelease } from "../src/content/types";
import { filterExercises } from "../src/content/query";
const exercises = (raw as ContentRelease).exercises;
test("muscle, equipment and multiword search combine, including secondary muscles", () => {
  const result = filterExercises(exercises, {
    muscle: "triceps",
    equipment: "barbell",
    query: "BENCH press",
  });
  assert.deepEqual(
    result.map((e) => e.id),
    ["barbell_bench_press"],
  );
});
test("clear filters restores order and unsupported filters are empty", () => {
  assert.deepEqual(filterExercises(exercises, {}), exercises);
  assert.deepEqual(filterExercises(exercises, { muscle: "neck" }), []);
  assert.deepEqual(filterExercises(exercises, { query: "nonexistent" }), []);
  assert.ok(filterExercises(exercises, { query: "lower back" }).length > 0);
});
test("equipment chips match any catalog id in their group", () => {
  const cable = filterExercises(
    exercises,
    { equipment: "cable" },
    { cable: ["cable_tower", "dual_cable"] },
  );
  assert.ok(cable.length > 0);
  for (const e of cable)
    assert.ok(e.equipment.some((q) => ["cable_tower", "dual_cable"].includes(q)));
});
