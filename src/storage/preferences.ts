import type { Model } from "../content/types";
import type { RecoverySpeed } from "../recovery/engine";
export type Units = "kg" | "lb";
/** Rest timer lengths offered in Profile, in seconds. */
export const restChoices = [30, 60, 90, 120, 180] as const;
export const defaultRest = 90;
export interface Preferences {
  model: Model;
  units: Units;
  recoverySpeed: RecoverySpeed;
  /** Rest timer length in seconds; one of `restChoices`. */
  restSeconds: number;
}
export interface Settings extends Preferences {
  onboarded: boolean;
}
export const defaults: Settings = {
  model: "male",
  units: "kg",
  recoverySpeed: "normal",
  restSeconds: defaultRest,
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
  // Added after backups existed: a missing or unknown value falls back instead of rejecting.
  const rest = Number(v.restSeconds);
  return {
    model: v.model,
    units: v.units,
    recoverySpeed: v.recoverySpeed as RecoverySpeed,
    restSeconds: (restChoices as readonly number[]).includes(rest) ? rest : defaultRest,
  };
}
