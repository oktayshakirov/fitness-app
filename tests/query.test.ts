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
const ids = (query: string, groups: Record<string, string[]> = {}) =>
  filterExercises(exercises, { query }, groups).map((e) => e.id);
test("everyday words find the right muscles", () => {
  const legs = ids("legs");
  for (const id of ["barbell_back_squat", "leg_press", "leg_curl", "lunge", "glute_bridge"]) assert.ok(legs.includes(id), id);
  assert.ok(!legs.includes("barbell_bench_press"));
  assert.ok(ids("arms").includes("dumbbell_curl"));
  assert.ok(ids("arms").includes("rope_pushdown"));
  assert.ok(!ids("arms").includes("leg_press"));
  for (const e of filterExercises(exercises, { query: "quads" }))
    assert.ok([...e.primary, ...e.secondary].includes("quadriceps"), e.id);
  assert.deepEqual(ids("pecs").sort(), ids("chest").sort());
  assert.ok(ids("core").includes("plank"));
  assert.ok(ids("back").includes("lat_pulldown"));
});
test("plurals, missing spaces and short equipment names match", () => {
  assert.deepEqual(ids("dumbbells"), ids("dumbbell"));
  assert.deepEqual(ids("pushups"), ["push_up"]);
  assert.deepEqual(ids("push ups"), ["push_up"]);
  // Hammer curls use dumbbells too.
  assert.deepEqual(ids("db curls").sort(), ["dumbbell_curl", "hammer_curl"]);
  assert.deepEqual(ids("rdl"), ["dumbbell_romanian_deadlift"]);
  assert.deepEqual(ids("ohp"), ["barbell_overhead_press"]);
  assert.deepEqual(ids("dumbell"), ids("dumbbell"));
  assert.ok(ids("lunges").includes("lunge"));
  assert.ok(ids("machine", { machine: ["leg_press", "leg_curl"] }).includes("leg_press"));
  assert.deepEqual(ids("zzz"), []);
});
test("the bodyweight chip and search include exercises that need no equipment", () => {
  const groups = { bodyweight: ["mat", "pullup_bar", "dip_station"] };
  const chip = filterExercises(exercises, { equipment: "bodyweight" }, groups).map((e) => e.id);
  for (const id of ["bodyweight_squat", "lunge", "push_up", "pull_up"]) assert.ok(chip.includes(id), id);
  assert.ok(!chip.includes("barbell_back_squat"));
  assert.ok(ids("bodyweight").includes("lunge"));
});
test("terms match at word starts, so short words do not hit the middle of others", () => {
  // "tri" is inside "hamstrings"; it should only find triceps work.
  for (const e of filterExercises(exercises, { query: "tri" }))
    assert.ok([...e.primary, ...e.secondary].includes("triceps"), e.id);
  assert.ok(!ids("tri").includes("leg_curl"));
  assert.deepEqual(ids("core").sort(), ["crunch", "plank"]);
});
