import { test } from "node:test";
import assert from "node:assert/strict";
import raw from "../src/content/bundled.json";
import type { ContentRelease } from "../src/content/types";
import { recovery } from "../src/recovery/engine";
import { suggestExercises } from "../src/recovery/suggest";
import type { LogEntry } from "../src/storage/types";
const exercises = (raw as ContentRelease).exercises;
const day = 86_400_000;
const now = Date.UTC(2026, 10, 4, 12);
const log = (exerciseId: string, at: number): LogEntry => {
  const e = exercises.find((x) => x.id === exerciseId)!;
  return { id: `${exerciseId}${at}`, exerciseId, exerciseName: e.name, timestamp: at, sets: [{ reps: 30, weightKg: 50 }], note: "", primary: e.primary, secondary: e.secondary };
};
test("a new user gets a varied, deterministic start", () => {
  const picks = suggestExercises(exercises, recovery([], now), []);
  assert.equal(picks.length, 3);
  assert.equal(new Set(picks.map((p) => p.muscle)).size, 3);
  assert.deepEqual(picks, suggestExercises(exercises, recovery([], now), []));
  assert.ok(picks.every((p) => p.lastTrained === undefined));
});
test("freshly trained muscles are skipped and rested ones come first", () => {
  const entries = [log("barbell_bench_press", now - 2 * 3600_000), log("lat_pulldown", now - 5 * day), log("leg_press", now - 4 * day)];
  const status = recovery(entries, now);
  const picks = suggestExercises(exercises, status, entries);
  for (const p of picks) {
    assert.ok(p.exercise.primary.every((m) => status[m].state === "ready"), p.exercise.id);
    assert.ok(!p.exercise.primary.includes("chest"));
  }
  // Never-trained muscles first, then lats (5 days) before quadriceps (4 days).
  const order = suggestExercises(exercises, status, entries, [], 30).map((p) => p.muscle);
  assert.ok(order.indexOf("lats") < order.indexOf("quadriceps"));
  assert.equal(order.indexOf("lats") > order.indexOf("biceps"), true);
});
test("favourites win ties", () => {
  const status = recovery([], now);
  const plain = suggestExercises(exercises, status, [], [], 30);
  const target = plain.find((p) => p.muscle === "chest")!.exercise.id === "push_up" ? "barbell_bench_press" : "push_up";
  const withFavorite = suggestExercises(exercises, status, [], [target], 30);
  assert.equal(withFavorite[0]!.exercise.id, target);
});
