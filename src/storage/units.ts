import type { Units } from "./preferences";
const poundsPerKg = 2.2046226218487757;
export const toDisplayWeight = (kg: number, units: Units) =>
  units === "lb" ? kg * poundsPerKg : kg;
export const toKilograms = (weight: number, units: Units) =>
  units === "lb" ? weight / poundsPerKg : weight;
export function weightText(kg: number, units: Units) {
  return String(Math.round(toDisplayWeight(kg, units) * 100) / 100);
}
