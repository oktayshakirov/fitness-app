import type { LogEntry } from "./types";
export function dayKey(value: number | Date) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dayBefore(d: Date) {
  const result = new Date(d);
  result.setDate(result.getDate() - 1);
  return result;
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
  return { activeDays, current, weekly };
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
