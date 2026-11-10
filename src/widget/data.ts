import { streaks, dayKey } from "../storage/calendar";
import { recovery } from "../recovery/engine";
import type { RecoverySpeed } from "../recovery/engine";
import type { LogEntry } from "../storage/types";
import { muscleIds, type Muscle } from "../content/types";

/**
 * Written by the app for the home screen widgets, which render without it. Each resting muscle
 * carries the moment it recovers, so the widget stays right as time passes.
 */
export interface WidgetData {
  isPro: boolean;
  total: number;
  /** Longest recovery first. */
  resting: { name: string; readyAt: number }[];
  streak: number;
  lastLogAt: number | null;
}

export function buildWidgetData(
  entries: LogEntry[],
  speed: RecoverySpeed,
  now: number,
  isPro: boolean,
  nameOf: (muscle: Muscle) => string,
): WidgetData {
  const status = recovery(entries, now, speed);
  const resting = muscleIds
    .filter((m) => status[m].state !== "ready")
    .map((m) => ({ name: nameOf(m), readyAt: now + status[m].readyInHours * 3_600_000 }))
    .sort((a, b) => b.readyAt - a.readyAt);
  return {
    isPro,
    total: muscleIds.length,
    resting,
    streak: streaks(entries, new Date(now)).current,
    lastLogAt: entries[0]?.timestamp ?? null,
  };
}

export interface WidgetView {
  percent: number;
  resting: string[];
  streak: number;
}

/** What to show at `now`. targets/widget/index.swift repeats this for iOS. */
export function widgetView(data: WidgetData, now: number): WidgetView {
  const resting = data.resting.filter((m) => m.readyAt > now).map((m) => m.name);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const last = data.lastLogAt === null ? null : dayKey(data.lastLogAt);
  const alive = last === dayKey(now) || last === dayKey(yesterday.getTime());
  return {
    percent: data.total ? Math.round(((data.total - resting.length) / data.total) * 100) : 100,
    resting,
    streak: alive ? data.streak : 0,
  };
}
