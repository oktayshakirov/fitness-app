import type { Exercise, Muscle } from "../content/types";
import type { LogEntry } from "../storage/types";
import type { MuscleRecovery } from "./engine";

export interface Suggestion {
  exercise: Exercise;
  /** The primary muscle it is suggested for. */
  muscle: Muscle;
  /** When that muscle was last trained as a primary, if ever. */
  lastTrained?: number;
}
/**
 * Exercises whose primary muscles are fully recovered (and no secondary muscle
 * is freshly trained). Muscles rested longest come first, never-trained ones
 * first of all; favourites win ties, then name. One suggestion per primary
 * muscle, so the list stays varied.
 */
export function suggestExercises(
  exercises: readonly Exercise[],
  status: Record<Muscle, MuscleRecovery>,
  entries: readonly LogEntry[],
  favorites: readonly string[] = [],
  limit = 3,
): Suggestion[] {
  const last = new Map<Muscle, number>();
  for (const e of entries)
    for (const m of e.primary) last.set(m, Math.max(last.get(m) ?? 0, e.timestamp));
  const favorite = new Set(favorites);
  // An exercise is only as rested as its most recently trained primary muscle; 0 = never.
  const rested = (e: Exercise) => Math.max(...e.primary.map((m) => last.get(m) ?? 0));
  const candidates = exercises
    .filter(
      (e) =>
        e.primary.length > 0 &&
        e.primary.every((m) => status[m].state === "ready") &&
        e.secondary.every((m) => status[m].state !== "trained"),
    )
    .sort(
      (a, b) =>
        rested(a) - rested(b) ||
        Number(favorite.has(b.id)) - Number(favorite.has(a.id)) ||
        a.name.localeCompare(b.name),
    );
  const used = new Set<Muscle>();
  const result: Suggestion[] = [];
  for (const exercise of candidates) {
    const muscle = exercise.primary[0]!;
    if (used.has(muscle)) continue;
    used.add(muscle);
    result.push({ exercise, muscle, lastTrained: last.get(muscle) });
    if (result.length === limit) break;
  }
  return result;
}
