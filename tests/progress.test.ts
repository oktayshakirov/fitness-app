import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultMetric, newBest, oneRepMax, platesPerSide, plateKits, progressSeries } from "../src/storage/progress";
import type { LogEntry, TrainingSet } from "../src/storage/types";
const log = (timestamp: number, sets: TrainingSet[]): LogEntry => ({
  id: String(timestamp),
  exerciseId: "bench",
  exerciseName: "Bench",
  timestamp,
  sets,
  note: "",
  primary: ["chest"],
  secondary: [],
});
test("a new best beats every earlier set; ties and first logs do not count", () => {
  const before = [log(1, [{ reps: 8, weightKg: 60 }]), log(2, [{ reps: 10, weightKg: 50 }])];
  assert.deepEqual(newBest(before, [{ reps: 5, weightKg: 62.5 }]), { reps: 5, weightKg: 62.5 });
  assert.deepEqual(newBest(before, [{ reps: 9, weightKg: 60 }]), { reps: 9, weightKg: 60 });
  assert.equal(newBest(before, [{ reps: 8, weightKg: 60 }]), undefined);
  assert.equal(newBest([], [{ reps: 8, weightKg: 100 }]), undefined);
  assert.equal(newBest(before, []), undefined);
  // Bodyweight: more reps is a record.
  assert.deepEqual(newBest([log(1, [{ reps: 15, weightKg: 0 }])], [{ reps: 20, weightKg: 0 }]), { reps: 20, weightKg: 0 });
});
test("one-rep max uses Epley for 1–12 reps of a weighted set", () => {
  assert.equal(oneRepMax({ reps: 1, weightKg: 100 }), 100);
  assert.equal(Math.round(oneRepMax({ reps: 5, weightKg: 100 })! * 100) / 100, 116.67);
  assert.equal(oneRepMax({ reps: 13, weightKg: 100 }), undefined);
  assert.equal(oneRepMax({ reps: 5, weightKg: 0 }), undefined);
});
test("progress series: one point per session with sets, oldest first, capped", () => {
  const entries = [
    log(3, [{ reps: 5, weightKg: 70 }, { reps: 8, weightKg: 60 }]),
    log(1, [{ reps: 10, weightKg: 50 }]),
    log(2, []),
  ];
  assert.deepEqual(progressSeries(entries, "heaviest"), [
    { timestamp: 1, value: 50 },
    { timestamp: 3, value: 70 },
  ]);
  assert.deepEqual(progressSeries(entries, "volume").map((p) => p.value), [500, 830]);
  assert.deepEqual(progressSeries(entries, "reps").map((p) => p.value), [10, 8]);
  assert.equal(progressSeries(entries, "heaviest", 1).length, 1);
  assert.equal(defaultMetric(entries), "heaviest");
  assert.equal(defaultMetric([log(1, [{ reps: 12, weightKg: 0 }])]), "reps");
});
test("plates per side load heaviest first and report what cannot be made", () => {
  const kg = plateKits.kg.plates;
  assert.deepEqual(platesPerSide(100, 20, kg).plates, [25, 15]);
  assert.deepEqual(platesPerSide(62.5, 20, kg), { plates: [20, 1.25], rest: 0, belowBar: false });
  assert.deepEqual(platesPerSide(61, 20, kg), { plates: [20], rest: 1, belowBar: false });
  assert.deepEqual(platesPerSide(20, 20, kg), { plates: [], rest: 0, belowBar: false });
  assert.equal(platesPerSide(15, 20, kg).belowBar, true);
  assert.deepEqual(platesPerSide(225, 45, plateKits.lb.plates).plates, [45, 45]);
  assert.deepEqual(platesPerSide(185, 45, plateKits.lb.plates).plates, [45, 25]);
});
