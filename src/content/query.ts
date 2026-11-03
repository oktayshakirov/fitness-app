import type { Exercise } from "./types";
export interface ExerciseFilter {
  muscle?: string;
  equipment?: string;
  query?: string;
}
const normalize = (s: string) => s.toLowerCase().replace(/[_-]/g, " ").trim();
/** `groups` maps an equipment chip (e.g. "cable") to the catalog ids it covers. */
export function filterExercises(
  exercises: Exercise[],
  filter: ExerciseFilter,
  groups: Record<string, string[]> = {},
): Exercise[] {
  const equipment = filter.equipment
    ? (groups[filter.equipment] ?? [filter.equipment])
    : [];
  const terms = normalize(filter.query ?? "")
    .split(/\s+/)
    .filter(Boolean);
  return exercises.filter(
    (e) =>
      (!filter.muscle ||
        [...e.primary, ...e.secondary].some((m) => m === filter.muscle)) &&
      (!equipment.length || e.equipment.some((q) => equipment.includes(q))) &&
      terms.every((term) =>
        normalize(
          [e.name, ...e.equipment, ...e.primary, ...e.secondary].join(" "),
        ).includes(term),
      ),
  );
}
