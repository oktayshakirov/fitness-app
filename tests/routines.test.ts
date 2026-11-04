import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { doneOn, move, nextExercise, parseRoutine, type Routine } from "../src/storage/routines";
import { applyBackup, parseBackup, serializeBackup } from "../src/storage/backup";
import { defaults, parsePreferences } from "../src/storage/preferences";
import { migrate } from "../src/storage/migrations";
import type { LogEntry } from "../src/storage/types";
const routine: Routine = {
  id: "push",
  name: "Push day",
  exercises: ["barbell_bench_press", "dips", "lateral_raise"],
  created: 1,
  updated: 2,
};
const log = (exerciseId: string, timestamp: number): LogEntry => ({
  id: `${exerciseId}-${timestamp}`,
  exerciseId,
  exerciseName: exerciseId,
  timestamp,
  sets: [],
  note: "",
  primary: ["chest"],
  secondary: [],
});
test("routines need a name and 1–30 distinct exercises", () => {
  assert.deepEqual(parseRoutine({ ...routine, name: "  Push day  " }), routine);
  for (const bad of [
    { ...routine, name: "   " },
    { ...routine, name: "x".repeat(61) },
    { ...routine, exercises: [] },
    { ...routine, exercises: ["dips", "dips"] },
    { ...routine, exercises: Array.from({ length: 31 }, (_, i) => `e${i}`) },
    { ...routine, created: -1 },
  ])
    assert.throws(() => parseRoutine(bad));
});
test("progress counts routine exercises logged on the day; next skips done ones", () => {
  const day = new Date(2026, 10, 4, 9).getTime();
  const done = doneOn(routine, [log("dips", day), log("squat", day), log("lateral_raise", day - 86_400_000)], "2026-11-04");
  assert.deepEqual([...done], ["dips"]);
  assert.equal(nextExercise(routine.exercises, done), "barbell_bench_press");
  assert.equal(nextExercise(["dips"], new Set(["dips"])), "dips");
});
test("move reorders without mutating and ignores moves past the ends", () => {
  const list = ["a", "b", "c"];
  assert.deepEqual(move(list, 0, 1), ["b", "a", "c"]);
  assert.deepEqual(move(list, 2, 0), ["c", "a", "b"]);
  assert.deepEqual(move(list, 0, -1), list);
  assert.deepEqual(list, ["a", "b", "c"]);
});
test("backups carry routines; older backups without them still import", () => {
  const text = serializeBackup([], defaults, [routine]);
  assert.deepEqual(parseBackup(text).routines, [routine]);
  const old = JSON.parse(text);
  delete old.routines;
  assert.deepEqual(parseBackup(JSON.stringify(old)).routines, []);
  assert.throws(() => parseBackup(JSON.stringify({ ...old, routines: [routine, routine] })));
});
test("importing routines merges by id inside the same transaction", () => {
  const db = new DatabaseSync(":memory:");
  const adapter = {
    execSync: (sql: string) => db.exec(sql),
    getFirstSync: <T>(sql: string) => db.prepare(sql).get() as T | null,
    runSync: (sql: string, ...params: (string | number)[]) => ({
      changes: Number(db.prepare(sql).run(...params).changes),
    }),
  };
  migrate(adapter);
  const backup = parseBackup(serializeBackup([], defaults, [routine]));
  applyBackup(adapter, backup);
  applyBackup(adapter, backup);
  const rows = db.prepare("SELECT id, name, exercises FROM routines").all();
  assert.deepEqual(
    rows.map((r) => [r.id, r.name, JSON.parse(String(r.exercises))]),
    [["push", "Push day", routine.exercises]],
  );
  db.close();
});
test("weekly goal and favourites are optional, bounded settings", () => {
  const { weeklyGoal: _g, favorites: _f, ...old } = defaults;
  assert.equal(parsePreferences(old).weeklyGoal, 3);
  assert.deepEqual(parsePreferences(old).favorites, []);
  assert.equal(parsePreferences({ ...defaults, weeklyGoal: 5 }).weeklyGoal, 5);
  assert.equal(parsePreferences({ ...defaults, weeklyGoal: 9 }).weeklyGoal, 3);
  assert.deepEqual(parsePreferences({ ...defaults, favorites: ["dips", "dips", 4, "", "squat"] }).favorites, [
    "dips",
    "squat",
  ]);
});
