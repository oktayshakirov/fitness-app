import type { Model } from "../content/types";
import type { RecoverySpeed } from "../recovery/engine";
export type Units = "kg" | "lb";
/** Rest timer lengths offered in Profile, in seconds. */
export const restChoices = [30, 60, 90, 120, 180] as const;
export const defaultRest = 90;
/** Training days per week offered as a goal in Profile. */
export const goalChoices = [2, 3, 4, 5, 6] as const;
export const defaultGoal = 3;
export interface Preferences {
  model: Model;
  units: Units;
  recoverySpeed: RecoverySpeed;
  /** Rest timer length in seconds; one of `restChoices`. */
  restSeconds: number;
  /** Training days per week to aim for; one of `goalChoices`. */
  weeklyGoal: number;
  /** Starred exercise ids. */
  favorites: string[];
}
export interface Settings extends Preferences {
  onboarded: boolean;
}
export const defaults: Settings = {
  model: "male",
  units: "kg",
  recoverySpeed: "normal",
  restSeconds: defaultRest,
  weeklyGoal: defaultGoal,
  favorites: [],
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
  const goal = Number(v.weeklyGoal);
  const favorites = Array.isArray(v.favorites)
    ? v.favorites.filter((f): f is string => typeof f === "string" && f.length > 0 && f.length <= 200)
    : [];
  return {
    model: v.model,
    units: v.units,
    recoverySpeed: v.recoverySpeed as RecoverySpeed,
    restSeconds: (restChoices as readonly number[]).includes(rest) ? rest : defaultRest,
    weeklyGoal: (goalChoices as readonly number[]).includes(goal) ? goal : defaultGoal,
    favorites: [...new Set(favorites)].slice(0, 500),
  };
}
