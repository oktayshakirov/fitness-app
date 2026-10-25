import { useSyncExternalStore } from "react";
import { openDatabaseSync } from "expo-sqlite";
import { randomUUID } from "expo-crypto";
import type { Exercise } from "../content/types";
import { migrate } from "./migrations";
import { validateSets, type LogEntry, type TrainingSet } from "./types";
let db: ReturnType<typeof openDatabaseSync> | undefined;
let entries: LogEntry[] = [];
const listeners = new Set<() => void>();
function database() {
  if (!db) {
    const candidate = openDatabaseSync("fitness.db");
    candidate.execSync("PRAGMA journal_mode=WAL;");
    migrate(candidate);
    db = candidate;
    refresh();
  }
  return db;
}
type Row = {
  id: string;
  exercise_id: string;
  exercise_name: string;
  timestamp: number;
  sets: string;
  note: string;
  primary_muscles: string;
  secondary_muscles: string;
};
function refresh() {
  if (!db) return;
  entries = db
    .getAllSync<Row>("SELECT * FROM entries ORDER BY timestamp DESC")
    .map((row) => ({
      id: row.id,
      exerciseId: row.exercise_id,
      exerciseName: row.exercise_name,
      timestamp: row.timestamp,
      sets: JSON.parse(row.sets),
      note: row.note,
      primary: JSON.parse(row.primary_muscles),
      secondary: JSON.parse(row.secondary_muscles),
    }));
  for (const listener of listeners) listener();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function useEntries() {
  database();
  return useSyncExternalStore(
    subscribe,
    () => entries,
    () => entries,
  );
}
export function getEntries() {
  database();
  return entries;
}
export function saveEntry(entry: LogEntry) {
  validateSets(entry.sets);
  if (
    !Number.isFinite(entry.timestamp) ||
    entry.timestamp < 0 ||
    entry.note.length > 2000
  )
    throw new Error("Invalid log entry.");
  database().runSync(
    "INSERT OR REPLACE INTO entries (id,exercise_id,exercise_name,timestamp,sets,note,primary_muscles,secondary_muscles) VALUES (?,?,?,?,?,?,?,?)",
    entry.id,
    entry.exerciseId,
    entry.exerciseName,
    entry.timestamp,
    JSON.stringify(entry.sets),
    entry.note,
    JSON.stringify(entry.primary),
    JSON.stringify(entry.secondary),
  );
  refresh();
}
export function logExercise(
  exercise: Exercise,
  sets: TrainingSet[] = [],
  note = "",
) {
  const entry: LogEntry = {
    id: randomUUID(),
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    timestamp: Date.now(),
    sets,
    note,
    primary: exercise.primary,
    secondary: exercise.secondary,
  };
  saveEntry(entry);
  return entry;
}
export function deleteEntry(id: string) {
  database().runSync("DELETE FROM entries WHERE id=?", id);
  refresh();
}
