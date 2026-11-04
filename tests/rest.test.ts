import { test } from "node:test";
import assert from "node:assert/strict";
import { clock, extendRest, restLeft, restProgress, spokenDuration, startRest } from "../src/workout/rest";
import { defaults, parsePreferences } from "../src/storage/preferences";
test("a rest timer is two timestamps and counts down from them", () => {
  const timer = startRest(90, 1_000);
  assert.deepEqual(timer, { startedAt: 1_000, endsAt: 91_000 });
  assert.equal(restLeft(timer, 31_000), 60_000);
  assert.equal(restLeft(timer, 500_000), 0);
  assert.equal(restProgress(timer, 1_000), 1);
  assert.equal(restProgress(timer, 46_000), 0.5);
  assert.equal(restProgress(timer, 500_000), 0);
});
test("adding time extends the end; removing time never ends it in the past", () => {
  const timer = startRest(60, 0);
  assert.equal(extendRest(timer, 15, 10_000).endsAt, 75_000);
  assert.equal(extendRest(timer, -120, 10_000).endsAt, 11_000);
  // Progress shrinks against the longer total, so the line does not jump back to full.
  assert.equal(restProgress(extendRest(timer, 15, 30_000), 30_000), 0.6);
});
test("the clock rounds partial seconds up and reads 0:00 only at the end", () => {
  assert.equal(clock(90_000), "1:30");
  assert.equal(clock(89_001), "1:30");
  assert.equal(clock(59_000), "0:59");
  assert.equal(clock(1), "0:01");
  assert.equal(clock(0), "0:00");
  assert.equal(clock(-5), "0:00");
  assert.equal(clock(600_000), "10:00");
});
test("durations read naturally for screen readers", () => {
  assert.equal(spokenDuration(83_000), "1 minute 23 seconds");
  assert.equal(spokenDuration(120_000), "2 minutes");
  assert.equal(spokenDuration(1_000), "1 second");
  assert.equal(spokenDuration(0), "0 seconds");
});
test("rest length is optional in saved settings and backups", () => {
  const { restSeconds: _drop, ...old } = defaults;
  assert.equal(parsePreferences(old).restSeconds, 90);
  assert.equal(parsePreferences({ ...defaults, restSeconds: 7 }).restSeconds, 90);
  assert.equal(parsePreferences({ ...defaults, restSeconds: 120 }).restSeconds, 120);
  assert.throws(() => parsePreferences({ ...defaults, units: "stones" }));
});
