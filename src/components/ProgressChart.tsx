import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Text } from "./Text";
import { Segmented, s } from "./ui";
import { defaultMetric, progressSeries, type Metric } from "../storage/progress";
import { toDisplayWeight, weightText } from "../storage/units";
import type { Units } from "../storage/preferences";
import type { LogEntry } from "../storage/types";
import { colors } from "../theme";

/**
 * Per-exercise progress as columns, one per session (last 12), drawn with
 * plain views. Emphasis form: the latest session is lime, earlier ones a gray
 * that still clears 3:1 on the card (#6E6E73, validated). Single series, so no
 * legend; columns start at zero, are at most 24 pt wide with 4 pt rounded tops
 * on a hairline baseline. Labels are sparing: the readout and the first/last
 * dates. Tap a column (its whole slot is the target) to read that session; the
 * "Your sessions" list below is the table view.
 */
const plotHeight = 96;
const past = "#6E6E73";
const pastSelected = "#A1A1A6";
const shortDate = (t: number) => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function format(value: number, metric: Metric, units: Units) {
  if (metric === "reps") return `${value} ${value === 1 ? "rep" : "reps"}`;
  if (metric === "volume") return `${Math.round(toDisplayWeight(value, units)).toLocaleString()} ${units}`;
  return `${weightText(value, units)} ${units}`;
}
function change(delta: number, metric: Metric, units: Units) {
  if (!delta) return "no change";
  const sign = delta > 0 ? "+" : "−";
  const size = Math.abs(delta);
  return `${sign}${format(size, metric, units)}`;
}

export function ProgressChart({ entries, units }: { entries: readonly LogEntry[]; units: Units }) {
  const weighted = defaultMetric(entries) === "heaviest";
  const [metric, setMetric] = useState<Metric>(weighted ? "heaviest" : "reps");
  const active: Metric = weighted ? metric : "reps";
  const points = useMemo(() => progressSeries(entries, active), [entries, active]);
  const [picked, setPicked] = useState<number>();
  if (points.length < 2) return null;
  const max = Math.max(...points.map((p) => p.value), 0);
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const shown = picked !== undefined && points[picked] ? points[picked]! : last;
  const title = active === "heaviest" ? "Heaviest set" : active === "volume" ? "Volume (reps × weight)" : "Most reps in a set";
  const summary = `${title}, ${points.length} sessions, from ${format(first.value, active, units)} on ${shortDate(first.timestamp)} to ${format(last.value, active, units)} on ${shortDate(last.timestamp)}`;
  return (
    <View style={[s.card, { gap: 12 }]}>
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <Text accessibilityRole="header" style={s.headline}>
          Progress
        </Text>
        {weighted && (
          <View style={{ width: 190 }}>
            <Segmented
              label="Progress measure"
              value={metric}
              onChange={(m) => {
                setMetric(m);
                setPicked(undefined);
              }}
              options={[
                { value: "heaviest", title: "Heaviest" },
                { value: "volume", title: "Volume" },
              ]}
            />
          </View>
        )}
      </View>
      <View accessible accessibilityLabel={summary} accessibilityLiveRegion="polite">
        <Text style={s.footnote}>{title}</Text>
        <Text style={[s.title, { fontSize: 22 }]}>
          {format(shown.value, active, units)}
          <Text style={s.footnote}>
            {"  "}
            {shortDate(shown.timestamp)}
            {shown === last ? ` · ${change(last.value - first.value, active, units)} since ${shortDate(first.timestamp)}` : ""}
          </Text>
        </Text>
      </View>
      <View>
        <View style={{ height: plotHeight, flexDirection: "row", alignItems: "flex-end" }}>
          {points.map((p, i) => {
            const isLast = i === points.length - 1;
            const height = max > 0 ? Math.max(p.value > 0 ? 3 : 0, (p.value / max) * plotHeight) : 0;
            return (
              <Pressable
                key={p.timestamp}
                accessibilityRole="button"
                accessibilityLabel={`${shortDate(p.timestamp)}: ${format(p.value, active, units)}`}
                accessibilityState={{ selected: picked === i }}
                onPress={() => setPicked(picked === i ? undefined : i)}
                // The whole slot is the target, far larger than the column.
                style={{ flex: 1, height: plotHeight, alignItems: "center", justifyContent: "flex-end", paddingHorizontal: 1 }}
              >
                <View
                  style={{
                    width: "100%",
                    maxWidth: 24,
                    height,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    backgroundColor: isLast ? colors.accent : picked === i ? pastSelected : past,
                  }}
                />
              </Pressable>
            );
          })}
        </View>
        <View style={{ height: 1, backgroundColor: colors.surface3 }} />
        <View style={[s.row, { justifyContent: "space-between", marginTop: 6 }]}>
          <Text style={s.caption}>{shortDate(first.timestamp)}</Text>
          <Text style={s.caption}>{shortDate(last.timestamp)}</Text>
        </View>
      </View>
    </View>
  );
}
