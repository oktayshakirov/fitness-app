import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";

const native =
  Platform.OS === "ios" ? requireOptionalNativeModule<{ send(json: string): void }>("MusclePalWatchLink") : null;

/** iOS: hands the recovery summary to the Apple Watch app. A no-op elsewhere or without a watch. */
export function sendToWatch(json: string) {
  native?.send(json);
}
