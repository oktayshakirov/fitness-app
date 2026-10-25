import { test } from "node:test";
import assert from "node:assert/strict";
import { recovery, recoveryState } from "../src/recovery/engine";
import type { LogEntry } from "../src/storage/types";
const now = Date.UTC(2026, 9, 25, 12);
const hour = 3600000;
function log(patch: Partial<LogEntry> = {}): LogEntry {
  return {
    id: "one",
    exerciseId: "press",
    exerciseName: "Press",
    timestamp: now,
    primary: ["chest"],
    secondary: ["triceps"],
    sets: [{ reps: 30, weightKg: 0 }],
    note: "",
    ...patch,
  };
}
test("never-trained muscles are ready and primary/secondary weights differ", () => {
  const result = recovery([log()], now);
  assert.equal(result.chest.fatigue, 1);
  assert.equal(result.triceps.fatigue, 0.5);
  assert.deepEqual(result.quadriceps, {
    fatigue: 0,
    state: "ready",
    readyInHours: 0,
  });
  assert.equal(Object.keys(result).length, 17);
});
test("large, medium and small windows decay independently to exact zero", () => {
  const entry = log({
    primary: ["chest", "shoulders", "biceps"],
    secondary: [],
  });
  assert.equal(recovery([entry], now + 24 * hour).biceps.fatigue, 0.5);
  assert.equal(recovery([entry], now + 48 * hour).biceps.state, "ready");
  assert.equal(recovery([entry], now + 60 * hour).shoulders.state, "ready");
  assert.equal(recovery([entry], now + 71 * hour).chest.readyInHours, 1);
  assert.equal(recovery([entry], now + 72 * hour).chest.state, "ready");
});
test("speed changes windows, not initial fatigue", () => {
  assert.equal(recovery([log()], now, "fast").chest.readyInHours, 54);
  assert.equal(recovery([log()], now, "slow").chest.readyInHours, 90);
  assert.equal(recovery([log()], now + 54 * hour, "fast").chest.state, "ready");
  assert.equal(recovery([log()], now + 45 * hour, "slow").chest.fatigue, 0.5);
});
test("done logs scale down; reps cap; weight does not change the estimate", () => {
  assert.equal(recovery([log({ sets: [] })], now).chest.fatigue, 0.5);
  assert.equal(
    recovery([log({ sets: [{ reps: 15, weightKg: 100 }] })], now).chest.fatigue,
    0.5,
  );
  assert.equal(
    recovery([log({ sets: [{ reps: 100, weightKg: 100 }] })], now).chest
      .fatigue,
    1,
  );
});
test("overlapping sessions sum, cap, retain separate expiry and ignore future logs", () => {
  const older = log({ id: "old", timestamp: now - 36 * hour });
  const newer = log({ sets: [], secondary: ["chest"] });
  const result = recovery([older, newer, log({ timestamp: now + hour })], now);
  assert.equal(result.chest.fatigue, 1);
  assert.equal(result.chest.readyInHours, 72);
  assert.deepEqual(result, recovery([newer, older], now));
  assert.equal(recovery([older, newer], now + 36 * hour).chest.fatigue, 0.25);
  assert.equal(recovery([older, newer], now + 72 * hour).chest.state, "ready");
});
test("state boundaries match the product contract", () => {
  assert.equal(recoveryState(0), "ready");
  assert.equal(recoveryState(0.329), "almost");
  assert.equal(recoveryState(0.33), "recovering");
  assert.equal(recoveryState(0.66), "recovering");
  assert.equal(recoveryState(0.661), "trained");
});
