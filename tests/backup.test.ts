import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import {
  applyBackup,
  parseBackup,
  serializeBackup,
} from "../src/storage/backup";
import { defaults } from "../src/storage/preferences";
import { migrate } from "../src/storage/migrations";
import type { LogEntry } from "../src/storage/types";
const log: LogEntry = {
  id: "a",
  exerciseId: "removed-exercise",
  exerciseName: "Saved name",
  timestamp: 100,
  sets: [{ reps: 12, weightKg: 40 }],
  note: "私の記録",
  primary: ["chest"],
  secondary: ["triceps"],
};
function fixture() {
  const db = new DatabaseSync(":memory:");
  const adapter = {
    execSync: (sql: string) => db.exec(sql),
    getFirstSync: <T>(sql: string) => db.prepare(sql).get() as T | null,
    runSync: (sql: string, ...params: (string | number)[]) => ({
      changes: Number(db.prepare(sql).run(...params).changes),
    }),
  };
  migrate(adapter);
  return { db, adapter };
}
test("backup round-trips snapshots and Unicode notes without the current catalog", () => {
  const backup = parseBackup(
    serializeBackup([log], { ...defaults, model: "female", units: "lb" }),
  );
  assert.deepEqual(backup.entries, [log]);
  assert.equal(backup.preferences.model, "female");
});
test("malformed, future, invalid and duplicate backups are rejected before writes", () => {
  const data = JSON.parse(serializeBackup([log], defaults));
  for (const change of [
    { schemaVersion: 2 },
    { entries: [log, log] },
    { entries: [{ ...log, sets: [{ reps: -1, weightKg: 1 }] }] },
    { entries: [{ ...log, primary: ["unknown"] }] },
    { preferences: { ...defaults, units: "stones" } },
  ])
    assert.throws(() => parseBackup(JSON.stringify({ ...data, ...change })));
  assert.throws(() => parseBackup("bad JSON"));
});
test("import merges idempotently, preserves existing edits and applies preferences", () => {
  const { db, adapter } = fixture();
  const first = parseBackup(serializeBackup([log], defaults));
  assert.deepEqual(applyBackup(adapter, first), { added: 1, skipped: 0 });
  db.prepare("UPDATE entries SET note=? WHERE id=?").run("local edit", "a");
  const next = parseBackup(
    serializeBackup([log, { ...log, id: "b" }], { ...defaults, units: "lb" }),
  );
  assert.deepEqual(applyBackup(adapter, next), { added: 1, skipped: 1 });
  assert.equal(
    db.prepare("SELECT note FROM entries WHERE id='a'").get()?.note,
    "local edit",
  );
  assert.equal(
    db.prepare("SELECT value FROM settings WHERE key='units'").get()?.value,
    '"lb"',
  );
  db.close();
});
test("failure after inserting logs rolls back logs and preferences together", () => {
  const { db, adapter } = fixture();
  const failing = {
    ...adapter,
    runSync(sql: string, ...params: (string | number)[]) {
      if (sql.includes("INTO settings")) throw new Error("disk full");
      return adapter.runSync(sql, ...params);
    },
  };
  assert.throws(
    () => applyBackup(failing, parseBackup(serializeBackup([log], defaults))),
    /disk full/,
  );
  assert.equal(db.prepare("SELECT count(*) AS n FROM entries").get()?.n, 0);
  assert.equal(db.prepare("SELECT count(*) AS n FROM settings").get()?.n, 0);
  db.close();
});
