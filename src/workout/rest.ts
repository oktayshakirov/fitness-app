/**
 * Rest timer math. A timer is two timestamps, so it stays correct while the
 * app is in the background (JS timers stop there) and after any delay.
 * No React or Expo imports: node tests drive it.
 */
export interface RestTimer {
  startedAt: number;
  endsAt: number;
}

export function startRest(seconds: number, now: number): RestTimer {
  return { startedAt: now, endsAt: now + Math.max(1, seconds) * 1000 };
}

/** Adds (or with a negative value removes) time; never ends sooner than a second from now. */
export function extendRest(timer: RestTimer, seconds: number, now: number): RestTimer {
  return { ...timer, endsAt: Math.max(now + 1000, timer.endsAt + seconds * 1000) };
}

/** Milliseconds left, never negative. */
export function restLeft(timer: RestTimer, now: number) {
  return Math.max(0, timer.endsAt - now);
}

/** Share of the rest still to go (1 at the start, 0 when done), for a progress line. */
export function restProgress(timer: RestTimer, now: number) {
  const total = timer.endsAt - timer.startedAt;
  return total > 0 ? Math.min(1, restLeft(timer, now) / total) : 0;
}

/** "1:30"; partial seconds round up, so the clock reads 0:00 only when time is up. */
export function clock(ms: number) {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** "1 minute 23 seconds", for screen readers. */
export function spokenDuration(ms: number) {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const parts = [
    m ? `${m} ${m === 1 ? "minute" : "minutes"}` : "",
    s || !m ? `${s} ${s === 1 ? "second" : "seconds"}` : "",
  ];
  return parts.filter(Boolean).join(" ");
}
