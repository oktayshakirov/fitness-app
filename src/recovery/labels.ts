import { colors } from "../palettes";
import { plural } from "../storage/format";
import type { RecoveryState } from "./engine";
export const stateNames: Record<RecoveryState, string> = {
  trained: "Trained",
  recovering: "Recovering",
  almost: "Almost ready",
  ready: "Ready",
};
/** Getters, so the colours follow the light or dark palette. */
export const stateColors: Record<RecoveryState, string> = {
  get trained() {
    return colors.trained;
  },
  get recovering() {
    return colors.recovering;
  },
  get almost() {
    return colors.almost;
  },
  get ready() {
    return colors.ready;
  },
};
/** "ready in ~5 h" under a day, then whole days ("ready in ~2 days"); "" when ready. */
export function readyIn(hours: number) {
  if (!(hours > 0)) return "";
  return hours < 24
    ? `ready in ~${Math.ceil(hours)} h`
    : `ready in ~${plural(Math.round(hours / 24), "day")}`;
}
