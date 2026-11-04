import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, dayKey, dayLabel, monthDays, onDay, streaks, weekDays } from "../src/storage/calendar";
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
    longest: 2,
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
    longest: 0,
  });
});
test("week days run Monday to Sunday around the given day", () => {
  const days = weekDays(new Date(2026, 10, 4, 9)).map((d) => dayKey(d));
  assert.deepEqual(days[0], "2026-11-02");
  assert.deepEqual(days[6], "2026-11-08");
});
test("longest streak spans months and ignores later gaps", () => {
  const entries = ["2026-01-30", "2026-01-31", "2026-02-01", "2026-02-05", "2026-02-06"].map((d) =>
    entry(`${d}T09:00:00`),
  );
  const result = streaks(entries, new Date("2026-02-06T20:00:00"));
  assert.equal(result.longest, 3);
  assert.equal(result.current, 2);
});
test("moving a log keeps its clock time and never lands in the future", () => {
  const logged = new Date(2026, 10, 4, 18, 30).getTime();
  const now = new Date(2026, 10, 4, 19, 0).getTime();
  assert.equal(onDay(logged, new Date(2026, 10, 2, 12), now), new Date(2026, 10, 2, 18, 30).getTime());
  // Yesterday 23:00 moved to today at 19:00 is clamped to now.
  const late = new Date(2026, 10, 3, 23, 0).getTime();
  assert.equal(onDay(late, new Date(2026, 10, 4, 12), now), now);
  assert.equal(dayKey(addDays(new Date(2026, 2, 1, 12), -1)), "2026-02-28");
});
test("day labels name today and yesterday", () => {
  const now = new Date(2026, 0, 1, 8);
  assert.equal(dayLabel(new Date(2026, 0, 1, 23), now), "Today");
  assert.equal(dayLabel(new Date(2025, 11, 31, 1), now), "Yesterday");
  assert.notEqual(dayLabel(new Date(2025, 11, 30, 12), now), "Yesterday");
});
