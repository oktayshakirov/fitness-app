import { muscleIds, type Muscle } from "../content/types";
import type { LogEntry } from "../storage/types";

export type RecoverySpeed = "normal" | "fast" | "slow";
export type RecoveryState = "trained" | "recovering" | "almost" | "ready";
export interface MuscleRecovery {
  fatigue: number;
  state: RecoveryState;
  readyInHours: number;
}
const hours: Record<Muscle, number> = {
  chest: 72,
  shoulders: 60,
  biceps: 48,
  triceps: 48,
  forearms: 48,
  abs: 48,
  quadriceps: 72,
  hamstrings: 72,
  glutes: 72,
  calves: 48,
  lats: 72,
  traps: 60,
  middle_back: 60,
  lower_back: 72,
  adductors: 60,
  abductors: 60,
  neck: 48,
};
const speedScale: Record<RecoverySpeed, number> = {
  normal: 1,
  fast: 0.75,
  slow: 1.25,
};
export function recoveryState(fatigue: number): RecoveryState {
  if (fatigue <= 0) return "ready";
  if (fatigue < 0.33) return "almost";
  if (fatigue <= 0.66) return "recovering";
  return "trained";
}
/** Done-only is half a session; 30 total reps reaches the per-entry cap.
 * Weight is deliberately excluded: this estimate does not know relative effort.
 * Contributions decay independently, then sum to a maximum displayed fatigue of 1.
 */
export function recovery(
  entries: readonly LogEntry[],
  now: number,
  speed: RecoverySpeed = "normal",
): Record<Muscle, MuscleRecovery> {
  if (!Number.isFinite(now))
    throw new Error("Recovery needs a valid current time.");
  return Object.fromEntries(
    muscleIds.map((muscle) => {
      const windowMs = hours[muscle] * speedScale[speed] * 3600000;
      let sum = 0,
        remaining = 0;
      for (const entry of entries) {
        const age = now - entry.timestamp;
        if (!Number.isFinite(age) || age < 0 || age >= windowMs) continue;
        const factor = entry.primary.includes(muscle)
          ? 1
          : entry.secondary.includes(muscle)
            ? 0.5
            : 0;
        if (!factor) continue;
        const load = entry.sets.length
          ? Math.min(1, entry.sets.reduce((n, set) => n + set.reps, 0) / 30)
          : 0.5;
        if (!Number.isFinite(load) || load <= 0) continue;
        sum += factor * load * (1 - age / windowMs);
        remaining = Math.max(remaining, windowMs - age);
      }
      const fatigue = Math.min(1, sum);
      return [
        muscle,
        {
          fatigue,
          state: recoveryState(fatigue),
          readyInHours: Math.ceil(remaining / 3600000),
        },
      ];
    }),
  ) as Record<Muscle, MuscleRecovery>;
}
