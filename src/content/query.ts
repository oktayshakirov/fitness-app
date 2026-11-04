import type { Exercise } from "./types";
export interface ExerciseFilter {
  muscle?: string;
  equipment?: string;
  query?: string;
}
/** Chip id for exercises that need nothing at all (an empty equipment list). */
export const NO_EQUIPMENT = "bodyweight";
const normalize = (s: string) => s.toLowerCase().replace(/[_-]/g, " ").trim();
const legs = ["quadriceps", "hamstrings", "glutes", "calves", "adductors", "abductors"];
/** Everyday words mapped to the catalog words they should find (whole search terms only). */
const synonyms: Record<string, string[]> = {
  leg: legs,
  legs: legs,
  thigh: ["quadriceps", "hamstrings", "adductors", "abductors"],
  thighs: ["quadriceps", "hamstrings", "adductors", "abductors"],
  arm: ["biceps", "triceps", "forearms"],
  arms: ["biceps", "triceps", "forearms"],
  back: ["lats", "middle back", "lower back", "traps"],
  core: ["abs"],
  ab: ["abs"],
  abdominal: ["abs"],
  abdominals: ["abs"],
  stomach: ["abs"],
  quad: ["quadriceps"],
  quads: ["quadriceps"],
  ham: ["hamstrings"],
  hams: ["hamstrings"],
  delt: ["shoulders"],
  delts: ["shoulders"],
  deltoid: ["shoulders"],
  deltoids: ["shoulders"],
  pec: ["chest"],
  pecs: ["chest"],
  pectorals: ["chest"],
  butt: ["glutes"],
  bum: ["glutes"],
  calf: ["calves"],
  db: ["dumbbell"],
  dumbell: ["dumbbell"],
  dumbells: ["dumbbell"],
  rdl: ["romanian deadlift"],
  ohp: ["overhead press"],
  bb: ["barbell"],
  kb: ["kettlebell"],
};
/** Catalog equipment, or the bodyweight chip id for exercises that need none. */
export const equipmentOf = (e: Exercise) =>
  e.equipment.length ? e.equipment : [NO_EQUIPMENT];
/**
 * A term matches at the start of a word ("tri" finds triceps, not hamstrings),
 * through a synonym, or without a plural "s"/"es". Longer terms may skip
 * spaces ("pushup" finds "Push-up").
 */
function termMatches(term: string, words: string, compact: string) {
  const options = [term, ...(synonyms[term] ?? [])];
  if (term.length > 3 && term.endsWith("es")) options.push(term.slice(0, -2));
  if (term.length > 3 && term.endsWith("s")) options.push(term.slice(0, -1));
  return options.some(
    (o) => words.includes(` ${o}`) || (o.length >= 5 && compact.includes(o.replace(/\s+/g, ""))),
  );
}
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
  return exercises.filter((e) => {
    const owned = equipmentOf(e);
    if (filter.muscle && ![...e.primary, ...e.secondary].some((m) => m === filter.muscle)) return false;
    if (
      equipment.length &&
      !owned.some((q) => equipment.includes(q)) &&
      !(filter.equipment === NO_EQUIPMENT && !e.equipment.length)
    )
      return false;
    if (!terms.length) return true;
    // Chip names ("machine", "cable") are searchable too.
    const chips = Object.keys(groups).filter((chip) => owned.some((q) => groups[chip]!.includes(q)));
    const words = ` ${normalize([e.name, ...owned, ...chips, ...e.primary, ...e.secondary].join(" "))}`;
    const compact = words.replace(/\s+/g, "");
    // Each term, or the whole query run together ("push ups" → "pushup").
    return terms.every((term) => termMatches(term, words, compact)) || termMatches(terms.join(""), words, compact);
  });
}
