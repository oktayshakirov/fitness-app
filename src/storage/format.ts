import type { Units } from "./preferences";
import type { LogEntry, TrainingSet } from "./types";
import { weightText } from "./units";

/** "1 log", "3 logs"; pass `many` for irregular plurals ("entry" → "entries"). */
export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/** One set: "8 reps · 60 kg", or "8 reps" for bodyweight. */
export function setText(set: TrainingSet, units: Units) {
  const weight = weightText(set.weightKg, units);
  return `${plural(set.reps, "rep")}${weight === "0" ? "" : ` · ${weight} ${units}`}`;
}

/**
 * "3 × 10 · 40 kg, 1 × 8 · 45 kg": runs of identical sets are grouped as
 * sets × reps · weight. Bodyweight sets show no weight ("3 × 12").
 */
export function setsSummary(sets: readonly TrainingSet[], units: Units) {
  const groups: { count: number; reps: number; weight: string }[] = [];
  for (const set of sets) {
    const weight = weightText(set.weightKg, units);
    const last = groups[groups.length - 1];
    if (last && last.reps === set.reps && last.weight === weight) last.count++;
    else groups.push({ count: 1, reps: set.reps, weight });
  }
  return groups
    .map(
      ({ count, reps, weight }) =>
        `${count} × ${reps}${weight === "0" ? "" : ` · ${weight} ${units}`}`,
    )
    .join(", ");
}

/**
 * Heaviest set (most reps breaks ties) across the given logs, with the first
 * time it was done. Bodyweight-only history yields the set with most reps.
 */
export function bestSet(entries: readonly LogEntry[]) {
  let best: { set: TrainingSet; timestamp: number } | undefined;
  for (const entry of entries)
    for (const set of entry.sets) {
      const better =
        !best ||
        set.weightKg > best.set.weightKg ||
        (set.weightKg === best.set.weightKg &&
          (set.reps > best.set.reps ||
            (set.reps === best.set.reps && entry.timestamp < best.timestamp)));
      if (better) best = { set, timestamp: entry.timestamp };
    }
  return best;
}
