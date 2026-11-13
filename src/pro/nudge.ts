/**
 * When the paywall opens on its own, outside the Pro features. It waits until the app has proved
 * itself (a few separate training days), then shows at a good moment: right after a new training-day
 * milestone, or now and then for a regular user. It never opens twice close together, and opens at
 * most once per app launch.
 *
 * Pure so it can be unit tested; `pro.ts` and Home wire it to storage and the screen.
 */

/** Distinct training days that count as a milestone worth celebrating with an offer. */
export const milestones = [3, 7, 14, 30, 60, 100] as const;
/** No real value has been seen before this many training days. */
const minTrainingDays = milestones[0];
const day = 86_400_000;
/** Shortest gap between two automatic paywalls, whatever triggered them. */
export const minGapMs = 3 * day;
/** Without a new milestone, a regular user sees it at most this often. */
export const regularGapMs = 14 * day;

export interface NudgeState {
  /** When the paywall last opened on its own (ms), or 0. */
  lastShown: number;
  /** The highest milestone already used for an offer. */
  milestone: number;
}

export function paywallDue(trainingDays: number, now: number, state: NudgeState) {
  if (trainingDays < minTrainingDays) return false;
  const since = now - state.lastShown;
  if (since < minGapMs) return false;
  const reached = reachedMilestone(trainingDays);
  return reached > state.milestone || since >= regularGapMs;
}

/** The highest milestone at or below this many training days, or 0. */
export function reachedMilestone(trainingDays: number) {
  return milestones.filter((m) => m <= trainingDays).at(-1) ?? 0;
}
