import type { Exercise } from "./types";
export interface ExerciseFilter {
  muscle?: string;
  equipment?: string;
  query?: string;
}
const normalize = (s: string) => s.toLowerCase().replace(/[_-]/g, " ").trim();
export function filterExercises(
  exercises: Exercise[],
  filter: ExerciseFilter,
): Exercise[] {
  const terms = normalize(filter.query ?? "")
    .split(/\s+/)
    .filter(Boolean);
  return exercises.filter(
    (e) =>
      (!filter.muscle ||
        [...e.primary, ...e.secondary].some((m) => m === filter.muscle)) &&
      (!filter.equipment || e.equipment.includes(filter.equipment)) &&
      terms.every((term) =>
        normalize(
          [e.name, ...e.equipment, ...e.primary, ...e.secondary].join(" "),
        ).includes(term),
      ),
  );
}
