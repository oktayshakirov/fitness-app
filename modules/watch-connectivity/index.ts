import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";

const native =
  (Platform.OS === "ios" || Platform.OS === "android") ? requireOptionalNativeModule<{ send(json: string): void }>("MusclePalWatchLink") : null;

/** Sends the latest recovery summary to a paired Apple Watch or Wear OS companion. */
export function sendToWatch(json: string) {
  native?.send(json);
}
