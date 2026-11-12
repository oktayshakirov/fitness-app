import { Platform } from "react-native";
import Constants from "expo-constants";

/** The store version of this build: Android may run ahead of iOS (android.version in app.json). */
export const appVersion =
  (Platform.OS === "android" ? Constants.expoConfig?.android?.version : Constants.expoConfig?.ios?.version) ??
  Constants.expoConfig?.version ??
  "unknown";
