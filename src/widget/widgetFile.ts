import { File, Paths } from "expo-file-system";
import type { WidgetData } from "./data";

/** Android: the widget's task runs without the app, so it reads this file. */
const file = () => new File(Paths.document, "widget.json");

export function writeWidgetFile(data: WidgetData) {
  const target = file();
  if (!target.exists) target.create();
  target.write(JSON.stringify(data));
}

export function readWidgetFile(): WidgetData | null {
  try {
    const target = file();
    return target.exists ? (JSON.parse(target.textSync()) as WidgetData) : null;
  } catch {
    return null;
  }
}
