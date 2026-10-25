import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { migrate } from "../src/storage/migrations";
function fixture() {
  const db = new DatabaseSync(":memory:");
  return {
    db,
    adapter: {
      execSync: (sql: string) => db.exec(sql),
      getFirstSync: <T>(sql: string) => db.prepare(sql).get() as T | null,
    },
  };
}
test("fresh database migrates once and preserves existing entries on repeated launch", () => {
  const { db, adapter } = fixture();
  migrate(adapter);
  db.prepare("INSERT INTO entries VALUES (?,?,?,?,?,?,?,?)").run(
    "one",
    "squat",
    "Squat",
    100,
    "[]",
    "keep me",
    '["quadriceps"]',
    "[]",
  );
  migrate(adapter);
  assert.equal(db.prepare("PRAGMA user_version").get()?.user_version, 1);
  assert.equal(
    db.prepare("SELECT note FROM entries WHERE id=?").get("one")?.note,
    "keep me",
  );
  db.close();
});
test("failed migration rolls back schema and version together", () => {
  const { db, adapter } = fixture();
  assert.throws(() =>
    migrate(adapter, ["CREATE TABLE scratch(id INTEGER); INVALID SQL;"]),
  );
  assert.equal(db.prepare("PRAGMA user_version").get()?.user_version, 0);
  assert.equal(
    db.prepare("SELECT name FROM sqlite_master WHERE name='scratch'").get(),
    undefined,
  );
  migrate(adapter);
  assert.equal(db.prepare("PRAGMA user_version").get()?.user_version, 1);
  db.close();
});
test("future database is rejected without changing user data", () => {
  const { db, adapter } = fixture();
  db.exec(
    'PRAGMA user_version=99; CREATE TABLE valuable(value TEXT); INSERT INTO valuable VALUES ("saved");'.replace(
      '"saved"',
      "'saved'",
    ),
  );
  assert.throws(() => migrate(adapter), /newer version/);
  assert.equal(db.prepare("SELECT value FROM valuable").get()?.value, "saved");
  db.close();
});
