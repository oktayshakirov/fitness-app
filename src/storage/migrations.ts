export interface MigrationDatabase {
  execSync(sql: string): void;
  getFirstSync<T>(sql: string): T | null;
}
export const migrations = [
  `CREATE TABLE entries (
 id TEXT PRIMARY KEY NOT NULL, exercise_id TEXT NOT NULL, exercise_name TEXT NOT NULL,
 timestamp INTEGER NOT NULL, sets TEXT NOT NULL DEFAULT '[]', note TEXT NOT NULL DEFAULT '',
 primary_muscles TEXT NOT NULL, secondary_muscles TEXT NOT NULL
 ); CREATE INDEX entries_timestamp ON entries(timestamp DESC);
 CREATE INDEX entries_exercise ON entries(exercise_id, timestamp DESC);`,
] as const;
/** Each schema step and version update commit together. Never discard an unknown future schema. */
export function migrate(
  db: MigrationDatabase,
  steps: readonly string[] = migrations,
) {
  const version =
    db.getFirstSync<{ user_version: number }>("PRAGMA user_version")
      ?.user_version ?? 0;
  if (version > steps.length)
    throw new Error("This data needs a newer version of Fitness.");
  for (let i = version; i < steps.length; i++) {
    db.execSync("BEGIN IMMEDIATE");
    try {
      db.execSync(steps[i]!);
      db.execSync(`PRAGMA user_version = ${i + 1}`);
      db.execSync("COMMIT");
    } catch (error) {
      db.execSync("ROLLBACK");
      throw error;
    }
  }
}
