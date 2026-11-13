import { test } from "node:test";
import assert from "node:assert/strict";
import { minGapMs, paywallDue, reachedMilestone, regularGapMs } from "../src/pro/nudge";

const now = Date.UTC(2026, 10, 13);
const day = 86_400_000;
const fresh = { lastShown: 0, milestone: 0 };

test("the paywall waits until the app has been used on a few days", () => {
  assert.equal(paywallDue(0, now, fresh), false);
  assert.equal(paywallDue(2, now, fresh), false);
  assert.equal(paywallDue(3, now, fresh), true);
});

test("a new milestone shows it again once the short gap has passed", () => {
  const shownAt3 = { lastShown: now - 4 * day, milestone: 3 };
  assert.equal(paywallDue(6, now, shownAt3), false);
  assert.equal(paywallDue(7, now, shownAt3), true);
  assert.equal(paywallDue(7, now - 4 * day + minGapMs - 1, shownAt3), false);
});

test("without a milestone a regular user sees it at most every two weeks", () => {
  const shown = { lastShown: now - regularGapMs + day, milestone: 7 };
  assert.equal(paywallDue(10, now, shown), false);
  assert.equal(paywallDue(10, now + day, shown), true);
});

test("milestones round down to the last one reached", () => {
  assert.equal(reachedMilestone(2), 0);
  assert.equal(reachedMilestone(3), 3);
  assert.equal(reachedMilestone(29), 14);
  assert.equal(reachedMilestone(500), 100);
});
