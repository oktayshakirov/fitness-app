import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { eraseEntries, restoreEntries } from "../src/storage/erase";
import { insertEntries } from "../src/storage/backup";
import { migrate } from "../src/storage/migrations";
import type { LogEntry } from "../src/storage/types";
const log = (id: string, note = ""): LogEntry => ({
  id,
  exerciseId: "squat",
  exerciseName: "Squat",
  timestamp: 1_000,
  sets: [{ reps: 5, weightKg: 100 }],
  note,
  primary: ["quadriceps"],
  secondary: ["glutes"],
});
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
  insertEntries(adapter, [log("a", "first"), log("b")]);
  db.prepare("INSERT INTO settings (key,value) VALUES (?,?),(?,?)").run("onboarded", "true", "units", '"lb"');
  const count = () => Number(db.prepare("SELECT count(*) AS n FROM entries").get()?.n);
  return { db, adapter, count };
}
test("erasing removes every log but keeps settings and onboarding", () => {
  const { db, adapter, count } = fixture();
  assert.equal(eraseEntries(adapter), 2);
  assert.equal(count(), 0);
  const settings = db.prepare("SELECT key,value FROM settings ORDER BY key").all();
  assert.deepEqual(
    settings.map((r) => [r.key, r.value]),
    [
      ["onboarded", "true"],
      ["units", '"lb"'],
    ],
  );
  db.close();
});
test("undo restores the erased logs exactly, once", () => {
  const { db, adapter, count } = fixture();
  const before = db.prepare("SELECT * FROM entries ORDER BY id").all();
  eraseEntries(adapter);
  assert.equal(restoreEntries(adapter, [log("a", "first"), log("b")]), 2);
  assert.deepEqual(db.prepare("SELECT * FROM entries ORDER BY id").all(), before);
  assert.equal(restoreEntries(adapter, [log("a", "first")]), 0);
  assert.equal(count(), 2);
  db.close();
});
test("a failed erase leaves every log in place", () => {
  const { db, adapter, count } = fixture();
  const failing = {
    ...adapter,
    runSync(sql: string, ...params: (string | number)[]) {
      if (sql.startsWith("DELETE")) throw new Error("disk I/O error");
      return adapter.runSync(sql, ...params);
    },
  };
  assert.throws(() => eraseEntries(failing), /disk I\/O error/);
  assert.equal(count(), 2);
  // The transaction was rolled back, so the next write works.
  assert.equal(eraseEntries(adapter), 2);
  db.close();
});
