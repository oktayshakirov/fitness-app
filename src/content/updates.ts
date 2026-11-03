import { useEffect, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { bundled } from "./index";
import { checkDeviceUpdate } from "./device";

/**
 * Hosting base URL (directory holding current.json). Unset means no remote
 * checks: the app runs on the bundled release, as before M6.
 */
const raw = process.env.EXPO_PUBLIC_CONTENT_URL;
export const contentUrl = raw ? (raw.endsWith("/") ? raw : raw + "/") : null;
/** Network checks at most this often; every launch/foreground in development. */
const interval = __DEV__ ? 0 : 6 * 60 * 60 * 1000;

/** A downloaded version waiting for the next start (null = back to the bundle). */
let staged: { version: string | null } | null = null;
const listeners = new Set<() => void>();

async function check() {
  if (!contentUrl) return;
  const result = await checkDeviceUpdate(bundled, {
    baseUrl: contentUrl,
    interval,
  });
  if (__DEV__ && result.status !== "throttled")
    console.log("[content]", JSON.stringify(result));
  if (result.status === "staged") {
    staged = { version: result.version };
    listeners.forEach((l) => l());
  }
}

/** Checks on launch and whenever the app returns to the foreground. */
export function useContentUpdates() {
  useEffect(() => {
    void check();
    const sub = AppState.addEventListener(
      "change",
      (s) => s === "active" && void check(),
    );
    return () => sub.remove();
  }, []);
}

export function useStagedContent() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => staged,
  );
}
