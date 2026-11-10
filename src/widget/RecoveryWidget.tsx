import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { WidgetView } from "./data";

const BG = "#0B0B0C";
const LIME = "#C8FA3C";
const TEXT = "#FFFFFF";
const MUTED = "#9B9BA3";

function restingLine(resting: string[]) {
  if (!resting.length) return "All muscles ready";
  const shown = resting.slice(0, 3).join(", ");
  return resting.length > 3 ? `${shown} +${resting.length - 3}` : shown;
}

/** Android home screen widget. `view` is null on the free plan. */
export function RecoveryWidget({ view, width = 0 }: { view: WidgetView | null; width?: number }) {
  const wide = width >= 220;
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: BG,
        borderRadius: 24,
        padding: 14,
        justifyContent: "space-between",
      }}
    >
      <TextWidget text="Muscle Pal" style={{ color: LIME, fontSize: 13, fontWeight: "700" }} />
      {view ? (
        <FlexWidget style={{ width: "match_parent" }}>
          <TextWidget text={`${view.percent}%`} style={{ color: TEXT, fontSize: wide ? 40 : 36, fontWeight: "700" }} />
          <TextWidget text="recovered" style={{ color: MUTED, fontSize: 13 }} />
          <TextWidget
            text={restingLine(view.resting)}
            maxLines={wide ? 1 : 2}
            truncate="END"
            style={{ color: TEXT, fontSize: 12, marginTop: 6 }}
          />
          {view.streak > 0 && (
            <TextWidget text={`${view.streak}-day streak`} style={{ color: LIME, fontSize: 12, marginTop: 2 }} />
          )}
        </FlexWidget>
      ) : (
        <FlexWidget style={{ width: "match_parent" }}>
          <TextWidget text="Muscle recovery" style={{ color: TEXT, fontSize: 18, fontWeight: "700" }} />
          <TextWidget text="Upgrade to Pro to use this widget" style={{ color: MUTED, fontSize: 12, marginTop: 4 }} />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
