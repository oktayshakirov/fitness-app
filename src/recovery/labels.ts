import { colors } from "../theme";
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
