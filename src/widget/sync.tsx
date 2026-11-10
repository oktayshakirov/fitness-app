import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { ExtensionStorage } from "@bacons/apple-targets";
import { requestWidgetUpdate } from "react-native-android-widget";
import { label } from "../content";
import { getEntries, useEntries, useSettings } from "../storage/store";
import type { RecoverySpeed } from "../recovery/engine";
import { useIsPro } from "../pro/pro";
import { buildWidgetData, widgetView } from "./data";
import { writeWidgetFile } from "./widgetFile";
import { RecoveryWidget } from "./RecoveryWidget";

const APP_GROUP = "group.com.shadev.musclepal";
const ANDROID_WIDGETS = ["MusclePalRecovery", "MusclePalRecoveryWide"];

function pushToWidgets(speed: RecoverySpeed, isPro: boolean) {
  const data = buildWidgetData(getEntries(), speed, Date.now(), isPro, label);
  try {
    if (Platform.OS === "ios") {
      new ExtensionStorage(APP_GROUP).set("data", JSON.stringify(data));
      ExtensionStorage.reloadWidget();
    } else if (Platform.OS === "android") {
      writeWidgetFile(data);
      const view = isPro ? widgetView(data, Date.now()) : null;
      for (const widgetName of ANDROID_WIDGETS)
        void requestWidgetUpdate({
          widgetName,
          renderWidget: (info) => <RecoveryWidget view={view} width={info.width} />,
          widgetNotFound: () => undefined,
        });
    }
  } catch (error) {
    if (__DEV__) console.warn("[widget]", error);
  }
}

/** Mounted once at the root: keeps the widgets current with logs, settings and the Pro plan. */
export function useWidgetSync() {
  const entries = useEntries();
  const { recoverySpeed } = useSettings();
  const isPro = useIsPro();
  useEffect(() => {
    const id = setTimeout(() => pushToWidgets(recoverySpeed, isPro), 300);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background") pushToWidgets(recoverySpeed, isPro);
    });
    return () => {
      clearTimeout(id);
      sub.remove();
    };
  }, [entries, recoverySpeed, isPro]);
}
