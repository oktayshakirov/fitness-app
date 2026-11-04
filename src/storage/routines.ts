import { dayKey } from "./calendar";
import type { LogEntry } from "./types";

/** A saved list of exercises trained together, e.g. "Push day". */
export interface Routine {
  id: string;
  name: string;
  /** Exercise ids in training order. */
  exercises: string[];
  created: number;
  updated: number;
}
export const routineLimits = { name: 60, exercises: 30 } as const;

function text(value: unknown, max: number, what: string) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`Invalid ${what}.`);
  return value;
}
/** Validates a routine from the editor, the database or a backup; throws on bad input. */
export function parseRoutine(value: unknown): Routine {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid routine.");
  const v = value as Record<string, unknown>;
  const name = text(v.name, routineLimits.name * 2, "routine name").trim();
  if (name.length > routineLimits.name) throw new Error(`Keep the name under ${routineLimits.name} characters.`);
  if (!Array.isArray(v.exercises) || !v.exercises.length) throw new Error("Add at least one exercise.");
  if (v.exercises.length > routineLimits.exercises)
    throw new Error(`A routine can hold up to ${routineLimits.exercises} exercises.`);
  const exercises = v.exercises.map((id) => text(id, 200, "exercise"));
  if (new Set(exercises).size !== exercises.length) throw new Error("An exercise is listed twice.");
  for (const key of ["created", "updated"] as const)
    if (typeof v[key] !== "number" || !Number.isFinite(v[key]) || (v[key] as number) < 0)
      throw new Error("Invalid routine date.");
  return {
    id: text(v.id, 200, "routine id"),
    name,
    exercises,
    created: v.created as number,
    updated: v.updated as number,
  };
}
/** Routine exercises logged on the given local day (`dayKey`). */
export function doneOn(routine: Routine, entries: readonly LogEntry[], day: string) {
  const ids = new Set(routine.exercises);
  return new Set(entries.filter((e) => ids.has(e.exerciseId) && dayKey(e.timestamp) === day).map((e) => e.exerciseId));
}
/** The first exercise not done yet, in routine order; the first one when all are done. */
export function nextExercise(ids: readonly string[], done: ReadonlySet<string>) {
  return ids.find((id) => !done.has(id)) ?? ids[0];
}
/** A copy of `list` with the item at `from` moved to `to` (editor up/down). */
export function move<T>(list: readonly T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}
