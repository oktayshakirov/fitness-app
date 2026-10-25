import { test } from "node:test";
import assert from "node:assert/strict";
import { toDisplayWeight, toKilograms, weightText } from "../src/storage/units";
test("display units convert without changing canonical stored kilograms", () => {
  assert.equal(weightText(40, "kg"), "40");
  assert.equal(weightText(40, "lb"), "88.18");
  assert.ok(
    Math.abs(toKilograms(toDisplayWeight(40, "lb"), "lb") - 40) < 1e-10,
  );
  assert.equal(toKilograms(0, "lb"), 0);
});
