import type { LogEntry } from "./types";
export function dayKey(value: number | Date) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
/** `d` moved by whole calendar days, keeping its local clock time. */
export function addDays(d: Date, days: number) {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}
const dayBefore = (d: Date) => addDays(d, -1);
/** "Today", "Yesterday", else a short local date such as "Mon, Nov 2". */
export function dayLabel(day: Date, now = new Date()) {
  const key = dayKey(day);
  if (key === dayKey(now)) return "Today";
  if (key === dayKey(dayBefore(now))) return "Yesterday";
  return day.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
/** `timestamp`'s local clock time on `day`'s date, never later than `now`. */
export function onDay(timestamp: number, day: Date, now = Date.now()) {
  const t = new Date(timestamp);
  const moved = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    t.getHours(),
    t.getMinutes(),
    t.getSeconds(),
    t.getMilliseconds(),
  );
  return Math.min(moved.getTime(), now);
}
function monday(d: Date) {
  const result = new Date(d);
  result.setHours(12, 0, 0, 0);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}
export function streaks(entries: LogEntry[], now = new Date(), month = now) {
  const days = new Set(
    entries
      .filter((e) => e.timestamp <= now.getTime())
      .map((e) => dayKey(e.timestamp)),
  );
  const activeDays = [...days].filter((k) =>
    k.startsWith(
      `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-`,
    ),
  ).length;
  let cursor = new Date(now),
    current = 0;
  if (!days.has(dayKey(cursor))) cursor = dayBefore(cursor);
  while (days.has(dayKey(cursor))) {
    current++;
    cursor = dayBefore(cursor);
  }
  const weeks = new Set(
    entries
      .filter((e) => e.timestamp <= now.getTime())
      .map((e) => dayKey(monday(new Date(e.timestamp)))),
  );
  let week = monday(now),
    weekly = 0;
  if (!weeks.has(dayKey(week))) week.setDate(week.getDate() - 7);
  while (weeks.has(dayKey(week))) {
    weekly++;
    week.setDate(week.getDate() - 7);
  }
  let longest = 0,
    run = 0,
    previous = "";
  // Keys sort chronologically; a run continues when the previous key is the day before.
  for (const key of [...days].sort()) {
    run = previous === dayKey(dayBefore(new Date(`${key}T12:00:00`))) ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = key;
  }
  return { activeDays, current, weekly, longest };
}
export function monthDays(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const offset = (start.getDay() + 6) % 7;
  const count = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, i) =>
    i < offset || i >= offset + count
      ? null
      : new Date(month.getFullYear(), month.getMonth(), i - offset + 1, 12),
  );
}
/** Monday to Sunday of the week containing `day`, at noon. */
export function weekDays(day: Date) {
  const start = monday(day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
