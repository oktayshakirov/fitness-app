import { test } from "node:test";
import assert from "node:assert/strict";
import { dayKey, monthDays, streaks } from "../src/storage/calendar";
import type { LogEntry } from "../src/storage/types";
const entry = (date: string): LogEntry => ({
  id: date,
  exerciseId: "squat",
  exerciseName: "Squat",
  timestamp: new Date(date).getTime(),
  sets: [],
  note: "",
  primary: [],
  secondary: [],
});
test("days deduplicate, yesterday keeps streak alive, Monday weeks cross years", () => {
  const entries = [
    "2025-12-28T12:00:00",
    "2025-12-31T12:00:00",
    "2026-01-03T12:00:00",
    "2026-01-04T12:00:00",
    "2026-01-04T13:00:00",
  ].map(entry);
  assert.deepEqual(streaks(entries, new Date("2026-01-05T14:00:00")), {
    activeDays: 2,
    current: 2,
    weekly: 2,
  });
});
test("calendar pads full weeks and handles leap February", () => {
  const days = monthDays(new Date(2024, 1, 1));
  assert.equal(days.length % 7, 0);
  assert.equal(days.filter(Boolean).length, 29);
  assert.equal(dayKey(days.filter(Boolean)[0]!), "2024-02-01");
});
test("future logs never increase streaks", () => {
  assert.deepEqual(streaks([entry("2027-01-01")], new Date("2026-01-01")), {
    activeDays: 0,
    current: 0,
    weekly: 0,
  });
});
