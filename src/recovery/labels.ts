import { colors } from "../theme";
import { plural } from "../storage/format";
import type { RecoveryState } from "./engine";
export const stateNames: Record<RecoveryState, string> = {
  trained: "Trained",
  recovering: "Recovering",
  almost: "Almost ready",
  ready: "Ready",
};
export const stateColors: Record<RecoveryState, string> = {
  trained: colors.trained,
  recovering: colors.recovering,
  almost: colors.almost,
  ready: colors.accent,
};
/** "ready in ~5 h" under a day, then whole days ("ready in ~2 days"); "" when ready. */
export function readyIn(hours: number) {
  if (!(hours > 0)) return "";
  return hours < 24
    ? `ready in ~${Math.ceil(hours)} h`
    : `ready in ~${plural(Math.round(hours / 24), "day")}`;
}
