import { test } from "node:test";
import assert from "node:assert/strict";
import { bestSet, plural, setText, setsSummary } from "../src/storage/format";
import type { LogEntry, TrainingSet } from "../src/storage/types";
const log = (timestamp: number, sets: TrainingSet[]): LogEntry => ({
  id: String(timestamp),
  exerciseId: "press",
  exerciseName: "Press",
  timestamp,
  sets,
  note: "",
  primary: ["chest"],
  secondary: [],
});
test("plurals use the singular only for exactly one", () => {
  assert.equal(plural(0, "log"), "0 logs");
  assert.equal(plural(1, "log"), "1 log");
  assert.equal(plural(1, "entry", "entries"), "1 entry");
  assert.equal(plural(2, "entry", "entries"), "2 entries");
});
test("identical consecutive sets group; bodyweight shows no weight", () => {
  const working = { reps: 10, weightKg: 40 };
  assert.equal(
    setsSummary([working, working, working, { reps: 8, weightKg: 45 }], "kg"),
    "3 × 10 · 40 kg, 1 × 8 · 45 kg",
  );
  assert.equal(setsSummary([{ reps: 12, weightKg: 0 }, { reps: 12, weightKg: 0 }], "kg"), "2 × 12");
  // Same weight separated by a different set is a new group.
  assert.equal(setsSummary([working, { reps: 8, weightKg: 40 }, working], "kg"), "1 × 10 · 40 kg, 1 × 8 · 40 kg, 1 × 10 · 40 kg");
  assert.equal(setsSummary([], "kg"), "");
});
test("summaries group on displayed pounds", () => {
  assert.equal(setsSummary([{ reps: 5, weightKg: 100 }, { reps: 5, weightKg: 100 }], "lb"), "2 × 5 · 220.46 lb");
  assert.equal(setText({ reps: 1, weightKg: 0 }, "lb"), "1 rep");
  assert.equal(setText({ reps: 8, weightKg: 60 }, "kg"), "8 reps · 60 kg");
});
test("best set prefers weight, then reps, then the first time it was done", () => {
  const entries = [
    log(300, [{ reps: 8, weightKg: 60 }]),
    log(200, [{ reps: 8, weightKg: 60 }, { reps: 12, weightKg: 50 }]),
    log(100, [{ reps: 5, weightKg: 60 }]),
  ];
  assert.deepEqual(bestSet(entries), { set: { reps: 8, weightKg: 60 }, timestamp: 200 });
  assert.deepEqual(bestSet([log(1, [{ reps: 15, weightKg: 0 }]), log(2, [{ reps: 20, weightKg: 0 }])])?.set, {
    reps: 20,
    weightKg: 0,
  });
  assert.equal(bestSet([log(1, [])]), undefined);
});
