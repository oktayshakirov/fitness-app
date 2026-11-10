import { test } from "node:test";
import assert from "node:assert/strict";
import { widgetView, type WidgetData } from "../src/widget/data";
import { canAddRoutine } from "../src/storage/routines";
import { defaults, parsePreferences } from "../src/storage/preferences";

const noon = new Date(2026, 10, 10, 12).getTime();
const hour = 3_600_000;
const data: WidgetData = {
  isPro: true,
  total: 4,
  resting: [
    { name: "Chest", readyAt: noon + 10 * hour },
    { name: "Triceps", readyAt: noon + 2 * hour },
  ],
  streak: 3,
  lastLogAt: noon - hour,
};

test("the widget counts muscles back to ready as time passes", () => {
  assert.deepEqual(widgetView(data, noon), { percent: 50, resting: ["Chest", "Triceps"], streak: 3 });
  assert.deepEqual(widgetView(data, noon + 3 * hour).resting, ["Chest"]);
  assert.equal(widgetView(data, noon + 3 * hour).percent, 75);
  assert.equal(widgetView(data, noon + 11 * hour).percent, 100);
});

test("the widget's streak ends after a full day without a log", () => {
  assert.equal(widgetView(data, noon + 24 * hour).streak, 3);
  assert.equal(widgetView(data, noon + 48 * hour).streak, 0);
  assert.equal(widgetView({ ...data, lastLogAt: null }, noon).streak, 0);
});

test("the free plan allows three routines and Pro has no limit", () => {
  assert.equal(canAddRoutine(2, false), true);
  assert.equal(canAddRoutine(3, false), false);
  assert.equal(canAddRoutine(40, true), true);
});

test("rest alerts stay off unless the user turned them on", () => {
  const { restAlerts: _drop, ...old } = defaults;
  assert.equal(parsePreferences(old).restAlerts, false);
  assert.equal(parsePreferences({ ...defaults, restAlerts: true }).restAlerts, true);
});
