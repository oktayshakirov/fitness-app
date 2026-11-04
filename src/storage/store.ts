import { defaults, parsePreferences, type Settings } from "./preferences";
import { applyBackup, parseBackup, serializeBackup } from "./backup";
import { eraseEntries, restoreEntries as restoreRows } from "./erase";
import { parseRoutine, type Routine } from "./routines";
import { useSyncExternalStore } from "react";
import { openDatabaseSync } from "expo-sqlite";
import { randomUUID } from "expo-crypto";
import type { Exercise } from "../content/types";
import { migrate } from "./migrations";
import { validateSets, type LogEntry, type TrainingSet } from "./types";
let db: ReturnType<typeof openDatabaseSync> | undefined;
let entries: LogEntry[] = [];
let routines: Routine[] = [];
let settings: Settings = defaults;
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
  const values = Object.fromEntries(
    db
      .getAllSync<{ key: string; value: string }>(
        "SELECT key,value FROM settings",
      )
      .map((row) => [row.key, JSON.parse(row.value)]),
  );
  settings = {
    ...parsePreferences({ ...defaults, ...values }),
    onboarded: values.onboarded === true,
  };
  routines = db
    .getAllSync<{ id: string; name: string; exercises: string; created: number; updated: number }>(
      "SELECT * FROM routines ORDER BY created ASC",
    )
    .flatMap((row) => {
      try {
        return [parseRoutine({ ...row, exercises: JSON.parse(row.exercises) })];
      } catch {
        return []; // A damaged row is skipped rather than breaking every screen.
      }
    });
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
  timestamp = Date.now(),
) {
  const entry: LogEntry = {
    id: randomUUID(),
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    timestamp,
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
/** Deletes every log; settings and onboarding stay. Returns the logs so Undo can put them back. */
export function eraseAllEntries() {
  const db = database();
  const removed = [...entries];
  eraseEntries(db);
  // Rewrite the file and empty the write-ahead log so erased notes do not linger on disk.
  try {
    db.execSync("VACUUM");
    db.execSync("PRAGMA wal_checkpoint(TRUNCATE)");
  } catch {
    // Best effort; the rows are already gone.
  }
  refresh();
  return removed;
}
export function restoreEntries(list: readonly LogEntry[]) {
  const added = restoreRows(database(), list);
  refresh();
  return added;
}

export function useSettings() {
  database();
  return useSyncExternalStore(
    subscribe,
    () => settings,
    () => settings,
  );
}
export function updateSettings(patch: Partial<Settings>) {
  const db = database();
  const next = { ...settings, ...patch };
  const validated: Settings = {
    ...parsePreferences(next),
    onboarded: next.onboarded === true,
  };
  db.execSync("BEGIN IMMEDIATE");
  try {
    for (const [key, value] of Object.entries(validated))
      db.runSync(
        "INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)",
        key,
        JSON.stringify(value),
      );
    db.execSync("COMMIT");
  } catch (error) {
    db.execSync("ROLLBACK");
    throw error;
  }
  refresh();
}
export function useRoutines() {
  database();
  return useSyncExternalStore(
    subscribe,
    () => routines,
    () => routines,
  );
}
export function getRoutines() {
  database();
  return routines;
}
/** Creates (no id) or updates a routine; throws with a readable message on invalid input. */
export function saveRoutine(input: { id?: string; name: string; exercises: string[] }) {
  const db = database();
  const now = Date.now();
  const existing = input.id ? routines.find((r) => r.id === input.id) : undefined;
  const routine = parseRoutine({
    id: input.id ?? randomUUID(),
    name: input.name,
    exercises: input.exercises,
    created: existing?.created ?? now,
    updated: now,
  });
  writeRoutine(db, routine);
  refresh();
  return routine;
}
function writeRoutine(db: ReturnType<typeof database>, r: Routine) {
  db.runSync(
    "INSERT OR REPLACE INTO routines (id,name,exercises,created,updated) VALUES (?,?,?,?,?)",
    r.id,
    r.name,
    JSON.stringify(r.exercises),
    r.created,
    r.updated,
  );
}
/** Deletes a routine and returns it, so Undo can put it back unchanged. */
export function deleteRoutine(id: string) {
  const removed = routines.find((r) => r.id === id);
  database().runSync("DELETE FROM routines WHERE id=?", id);
  refresh();
  return removed;
}
export function restoreRoutine(routine: Routine) {
  writeRoutine(database(), parseRoutine(routine));
  refresh();
}
export function exportData() {
  database();
  return serializeBackup(entries, settings, routines);
}
export function importData(text: string) {
  const validated = parseBackup(text);
  const result = applyBackup(database(), validated);
  refresh();
  return result;
}
