import { muscleIds, type Muscle } from "../content/types";
import { parsePreferences, type Preferences } from "./preferences";
import { validateSets, type LogEntry, type TrainingSet } from "./types";
import { parseRoutine, type Routine } from "./routines";
export const maxBackupBytes = 25 * 1024 * 1024;
export interface Backup {
  schemaVersion: 1;
  exportedAt: string;
  preferences: Preferences;
  entries: LogEntry[];
  /** Optional in the file (added after schema 1 shipped); always present once parsed. */
  routines: Routine[];
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid backup object.");
  return value as Record<string, unknown>;
}
function string(value: unknown, max: number, empty = false): string {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (!empty && !value.trim())
  )
    throw new Error("Invalid text in backup.");
  return value;
}
function muscles(value: unknown): Muscle[] {
  if (
    !Array.isArray(value) ||
    value.length > muscleIds.length ||
    value.some((v) => !muscleIds.includes(v))
  )
    throw new Error("Unknown muscle in backup.");
  return [...new Set(value)] as Muscle[];
}
function entry(value: unknown): LogEntry {
  const v = record(value);
  if (
    typeof v.timestamp !== "number" ||
    !Number.isFinite(v.timestamp) ||
    v.timestamp < 0 ||
    v.timestamp > 8640000000000000
  )
    throw new Error("Invalid log date.");
  if (!Array.isArray(v.sets) || v.sets.length > 100)
    throw new Error("Invalid sets.");
  const sets = v.sets.map((value) => {
    const s = record(value);
    if (typeof s.reps !== "number" || typeof s.weightKg !== "number")
      throw new Error("Invalid set values.");
    return { reps: s.reps, weightKg: s.weightKg } satisfies TrainingSet;
  });
  validateSets(sets);
  return {
    id: string(v.id, 200),
    exerciseId: string(v.exerciseId, 200),
    exerciseName: string(v.exerciseName, 300),
    timestamp: v.timestamp,
    sets,
    note: string(v.note, 2000, true),
    primary: muscles(v.primary),
    secondary: muscles(v.secondary),
  };
}
export function parseBackup(text: string): Backup {
  if (new TextEncoder().encode(text).byteLength > maxBackupBytes)
    throw new Error("Choose a backup smaller than 25 MB.");
  const v = record(JSON.parse(text));
  if (v.schemaVersion !== 1)
    throw new Error("This backup needs a different app version.");
  const exportedAt = string(v.exportedAt, 40);
  if (!Number.isFinite(Date.parse(exportedAt)))
    throw new Error("Invalid backup date.");
  if (!Array.isArray(v.entries) || v.entries.length > 100000)
    throw new Error("Invalid log list.");
  const entries = v.entries.map(entry);
  if (new Set(entries.map((e) => e.id)).size !== entries.length)
    throw new Error("This backup contains duplicate log IDs.");
  if (v.routines !== undefined && (!Array.isArray(v.routines) || v.routines.length > 200))
    throw new Error("Invalid routine list.");
  const routines = ((v.routines as unknown[] | undefined) ?? []).map(parseRoutine);
  if (new Set(routines.map((r) => r.id)).size !== routines.length)
    throw new Error("This backup contains duplicate routine IDs.");
  return {
    schemaVersion: 1,
    exportedAt,
    preferences: parsePreferences(v.preferences),
    entries,
    routines,
  };
}
export function serializeBackup(
  entries: readonly LogEntry[],
  preferences: Preferences,
  routines: readonly Routine[] = [],
  now = new Date(),
): string {
  const text = JSON.stringify(
    {
      schemaVersion: 1,
      exportedAt: now.toISOString(),
      preferences: parsePreferences(preferences),
      entries,
      routines,
    },
    null,
    2,
  );
  parseBackup(text);
  return text;
}
export interface BackupDatabase {
  execSync(sql: string): void;
  runSync(sql: string, ...params: (string | number)[]): { changes: number };
}
/** Inserts logs, keeping any row whose id already exists. Call inside a transaction. */
export function insertEntries(db: BackupDatabase, entries: readonly LogEntry[]) {
  let added = 0;
  for (const e of entries)
    added += db.runSync(
      "INSERT OR IGNORE INTO entries (id,exercise_id,exercise_name,timestamp,sets,note,primary_muscles,secondary_muscles) VALUES (?,?,?,?,?,?,?,?)",
      e.id,
      e.exerciseId,
      e.exerciseName,
      e.timestamp,
      JSON.stringify(e.sets),
      e.note,
      JSON.stringify(e.primary),
      JSON.stringify(e.secondary),
    ).changes;
  return added;
}
/** Inserts routines, keeping any whose id already exists. Call inside a transaction. */
export function insertRoutines(db: BackupDatabase, routines: readonly Routine[]) {
  let added = 0;
  for (const r of routines)
    added += db.runSync(
      "INSERT OR IGNORE INTO routines (id,name,exercises,created,updated) VALUES (?,?,?,?,?)",
      r.id,
      r.name,
      JSON.stringify(r.exercises),
      r.created,
      r.updated,
    ).changes;
  return added;
}
/** Keep existing IDs. Logs, routines and preferences commit together; a failed write changes none. */
export function applyBackup(db: BackupDatabase, backup: Backup) {
  let added = 0;
  db.execSync("BEGIN IMMEDIATE");
  try {
    added = insertEntries(db, backup.entries);
    insertRoutines(db, backup.routines);
    for (const [key, value] of Object.entries(backup.preferences))
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
  return { added, skipped: backup.entries.length - added };
}
