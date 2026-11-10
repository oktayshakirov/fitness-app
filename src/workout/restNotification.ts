import { useCallback, useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import { AppState, Platform } from "react-native";

/**
 * "Rest over" alert for when the app is in the background. Entirely local:
 * no push service, account or server. In the foreground the pill and haptic do this job.
 */
const ID = "rest-over";
const CHANNEL = "rest";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureChannel() {
  // Android 13 only shows the permission prompt once a channel exists.
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: "Rest timer",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 150, 250],
  });
}

/** Only called when the user turns Rest alerts on in Profile. "blocked" means only system settings can change it. */
export async function askForRestAlerts(): Promise<"allowed" | "denied" | "blocked"> {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return "allowed";
  if (!current.canAskAgain) return "blocked";
  const asked = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return asked.granted ? "allowed" : "denied";
}

async function apply(endsAt: number | null) {
  await Notifications.cancelScheduledNotificationAsync(ID);
  if (endsAt === null) {
    await Notifications.dismissNotificationAsync(ID);
    return;
  }
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted || endsAt <= Date.now() + 1000) return;
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: { title: "Rest over", body: "Time for your next set.", sound: "default" },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: endsAt, channelId: CHANNEL },
  });
}

let queue: Promise<void> = Promise.resolve();
/** Matches the alert to the timer. Calls run in order, so a quick +15 s or Skip cannot be overtaken. */
export function syncRestNotification(endsAt: number | null) {
  queue = queue.then(() => apply(endsAt)).catch((error) => {
    if (__DEV__) console.warn("[rest notification]", error);
  });
}

/**
 * Android 14+ treats a scheduled alert as approximate (a 90 s rest arrived 59 s late in testing)
 * until the user turns on exact alarms for the app in system settings.
 */
export function useExactRestAlerts() {
  const [allowed, setAllowed] = useState(true);
  const refresh = useCallback(() => {
    if (Platform.OS !== "android") return;
    void Notifications.getExactAlarmPermissionsAsync().then((r) => setAllowed(r.granted));
  }, []);
  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener("change", (state) => state === "active" && refresh());
    return () => sub.remove();
  }, [refresh]);
  const allow = useCallback(() => {
    void Notifications.requestExactAlarmPermissionsAsync().then((r) => setAllowed(r.granted));
  }, []);
  return { allowed, allow };
}
