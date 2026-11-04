import { useEffect, useState, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { extendRest, startRest, type RestTimer } from "./rest";

/** One rest timer for the whole app; any screen can start or read it. */
interface State {
  timer: RestTimer | null;
  /** When the last rest ran out, while the "Rest over" message shows. */
  finishedAt: number | null;
}
let state: State = { timer: null, finishedAt: null };
const listeners = new Set<() => void>();
function set(next: State) {
  state = next;
  listeners.forEach((l) => l());
}
export const restTimer = {
  start(seconds: number) {
    set({ timer: startRest(seconds, Date.now()), finishedAt: null });
  },
  extend(seconds: number) {
    if (state.timer) set({ ...state, timer: extendRest(state.timer, seconds, Date.now()) });
  },
  stop() {
    set({ timer: null, finishedAt: null });
  },
  finish() {
    if (state.timer) set({ timer: null, finishedAt: Date.now() });
  },
  dismiss() {
    if (state.finishedAt) set({ ...state, finishedAt: null });
  },
};
export function useRestTimer() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
  );
}
/**
 * Current time while `timer` runs, re-rendering on each whole second of the
 * countdown (not on a fixed interval) and again when the app returns to the
 * foreground, where JS timers may have been paused.
 */
export function useRestClock(timer: RestTimer | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!timer) return;
    let id: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const left = timer.endsAt - t;
      if (left > 0) id = setTimeout(tick, left % 1000 || 1000);
    };
    tick();
    const sub = AppState.addEventListener("change", (s) => {
      if (s !== "active") return;
      clearTimeout(id);
      tick();
    });
    return () => {
      clearTimeout(id);
      sub.remove();
    };
  }, [timer]);
  return now;
}
