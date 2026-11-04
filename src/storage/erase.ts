import { insertEntries, type BackupDatabase } from "./backup";
import type { LogEntry } from "./types";

/**
 * Deletes every log in one transaction. Settings, including onboarding, are
 * untouched. Returns how many logs were removed; a failure removes none.
 */
export function eraseEntries(db: BackupDatabase) {
  db.execSync("BEGIN IMMEDIATE");
  try {
    const { changes } = db.runSync("DELETE FROM entries");
    db.execSync("COMMIT");
    return changes;
  } catch (error) {
    db.execSync("ROLLBACK");
    throw error;
  }
}

/** Puts erased logs back (Undo) in one transaction; ids that exist again are kept as they are. */
export function restoreEntries(db: BackupDatabase, entries: readonly LogEntry[]) {
  db.execSync("BEGIN IMMEDIATE");
  try {
    const added = insertEntries(db, entries);
    db.execSync("COMMIT");
    return added;
  } catch (error) {
    db.execSync("ROLLBACK");
    throw error;
  }
}
