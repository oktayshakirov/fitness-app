import type { LogEntry, TrainingSet } from "./types";
import type { Units } from "./preferences";

/** Heavier wins; at the same weight, more reps wins. */
export function betterSet(a: TrainingSet, b: TrainingSet) {
  return a.weightKg > b.weightKg || (a.weightKg === b.weightKg && a.reps > b.reps);
}
function bestOf(sets: readonly TrainingSet[]) {
  let best: TrainingSet | undefined;
  for (const set of sets) if (!best || betterSet(set, best)) best = set;
  return best;
}
/**
 * The set in `sets` that beats every set in `previous` logs, or undefined.
 * A first log is not a record: there is nothing to beat yet.
 */
export function newBest(previous: readonly LogEntry[], sets: readonly TrainingSet[]) {
  const before = bestOf(previous.flatMap((e) => e.sets));
  const candidate = bestOf(sets);
  return before && candidate && betterSet(candidate, before) ? candidate : undefined;
}
/** Epley estimate of a one-rep max, in kg. Only for weighted sets of 1–12 reps, where it holds up. */
export function oneRepMax(set: TrainingSet) {
  if (set.weightKg <= 0 || set.reps < 1 || set.reps > 12) return undefined;
  return set.reps === 1 ? set.weightKg : set.weightKg * (1 + set.reps / 30);
}

export type Metric = "heaviest" | "volume" | "reps";
/** Weighted exercises chart weight; bodyweight-only ones chart reps. */
export function defaultMetric(entries: readonly LogEntry[]): Metric {
  return entries.some((e) => e.sets.some((s) => s.weightKg > 0)) ? "heaviest" : "reps";
}
/** One value per logged session with sets, oldest first, the last `limit` sessions. Weights in kg. */
export function progressSeries(entries: readonly LogEntry[], metric: Metric, limit = 12) {
  return entries
    .filter((e) => e.sets.length)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-limit)
    .map((e) => ({
      timestamp: e.timestamp,
      value:
        metric === "heaviest"
          ? Math.max(...e.sets.map((s) => s.weightKg))
          : metric === "volume"
            ? e.sets.reduce((n, s) => n + s.reps * s.weightKg, 0)
            : Math.max(...e.sets.map((s) => s.reps)),
    }));
}

/** Common bars and plates, in the user's units. */
export const plateKits: Record<Units, { bars: number[]; plates: number[]; step: number; start: number }> = {
  kg: { bars: [20, 15], plates: [25, 20, 15, 10, 5, 2.5, 1.25], step: 2.5, start: 60 },
  lb: { bars: [45, 35], plates: [45, 35, 25, 10, 5, 2.5], step: 5, start: 135 },
};
/**
 * Plates for one side of the bar, heaviest first, for a total in the same units.
 * `rest` is the part of the total that standard plates cannot make. Works in
 * hundredths so 62.5 never turns into 62.4999.
 */
export function platesPerSide(total: number, bar: number, plates: readonly number[]) {
  let side = Math.round(((total - bar) * 100) / 2);
  const loaded: number[] = [];
  if (side > 0)
    for (const plate of [...plates].sort((a, b) => b - a)) {
      const p = Math.round(plate * 100);
      while (p > 0 && side >= p) {
        loaded.push(plate);
        side -= p;
      }
    }
  return { plates: loaded, rest: Math.max(0, (side * 2) / 100), belowBar: total < bar };
}
