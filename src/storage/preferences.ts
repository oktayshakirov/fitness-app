import type { Model } from "../content/types";
import type { RecoverySpeed } from "../recovery/engine";
export type Units = "kg" | "lb";
export interface Preferences {
  model: Model;
  units: Units;
  recoverySpeed: RecoverySpeed;
}
export interface Settings extends Preferences {
  onboarded: boolean;
}
export const defaults: Settings = {
  model: "male",
  units: "kg",
  recoverySpeed: "normal",
  onboarded: false,
};
export function parsePreferences(value: unknown): Preferences {
  if (!value || typeof value !== "object")
    throw new Error("Invalid preferences.");
  const v = value as Record<string, unknown>;
  if (
    (v.model !== "male" && v.model !== "female") ||
    (v.units !== "kg" && v.units !== "lb") ||
    !["normal", "fast", "slow"].includes(String(v.recoverySpeed))
  )
    throw new Error("Invalid preferences.");
  return {
    model: v.model,
    units: v.units,
    recoverySpeed: v.recoverySpeed as RecoverySpeed,
  };
}
