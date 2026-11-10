import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { widgetView } from "./data";
import { readWidgetFile } from "./widgetFile";
import { RecoveryWidget } from "./RecoveryWidget";

const RENDER = ["WIDGET_ADDED", "WIDGET_UPDATE", "WIDGET_RESIZED"];

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (!RENDER.includes(props.widgetAction)) return;
  const data = readWidgetFile();
  props.renderWidget(
    <RecoveryWidget view={data?.isPro ? widgetView(data, Date.now()) : null} width={props.widgetInfo.width} />,
  );
}
