// Boots Expo Router, then registers the task that draws the Android home screen widgets.
import "expo-router/entry";
import { Platform } from "react-native";

if (Platform.OS === "android") {
  const { registerWidgetTaskHandler } = require("react-native-android-widget");
  const { widgetTaskHandler } = require("./src/widget/widgetTaskHandler");
  registerWidgetTaskHandler(widgetTaskHandler);
}
