import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Text } from "./Text";
import { Segmented, s } from "./ui";
import { PressableScale, motion } from "./motion";
import { plateKits, platesPerSide } from "../storage/progress";
import type { Units } from "../storage/preferences";
import { colors } from "../theme";

/** Plate heights in the graphic, by share of the heaviest plate. */
const plateHeight = (plate: number, heaviest: number) => 22 + Math.round((plate / heaviest) * 40);
const fmt = (n: number) => String(Math.round(n * 100) / 100);

/**
 * Collapsible card for barbell exercises: pick a total, see the plates for
 * each side. Starts from the last weight logged for the exercise.
 */
export function PlateCalculator({ units, startWeight }: { units: Units; startWeight?: number }) {
  const kit = plateKits[units];
  const [open, setOpen] = useState(false);
  const [bar, setBar] = useState(kit.bars[0]!);
  const [total, setTotal] = useState(() =>
    startWeight && startWeight >= kit.bars[0]! ? Math.round(startWeight / kit.step) * kit.step : kit.start,
  );
  useEffect(() => setBar(kit.bars[0]!), [kit]);
  const turn = useSharedValue(0);
  useEffect(() => {
    turn.value = withTiming(open ? 180 : 0, { duration: motion.base });
  }, [open, turn]);
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));
  const result = platesPerSide(total, bar, kit.plates);
  const heaviest = Math.max(...kit.plates);
  const change = (delta: number) => setTotal((t) => Math.max(0, Math.min(1000, Math.round((t + delta) * 100) / 100)));
  const plateText = result.plates.map(fmt).join(" · ");
  return (
    <Animated.View
      layout={LinearTransition.duration(motion.base)}
      style={{ backgroundColor: colors.surface, borderRadius: 24, paddingHorizontal: 18, overflow: "hidden" }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={[s.row, { minHeight: 52, justifyContent: "space-between" }]}
      >
        <Text style={[s.headline, { flex: 1 }]}>Plate calculator</Text>
        <Animated.View style={chevron}>
          <Ionicons name="chevron-down" size={18} color={colors.secondary} />
        </Animated.View>
      </Pressable>
      {open && (
        <Animated.View entering={FadeIn.duration(motion.base)} style={{ gap: 14, paddingBottom: 18 }}>
          <View style={[s.row, { justifyContent: "space-between" }]}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Decrease total by ${kit.step} ${units}`}
              onPress={() => change(-kit.step)}
              scaleTo={0.9}
              style={stepStyle}
            >
              <Ionicons name="remove" size={22} color={colors.text} />
            </PressableScale>
            <View accessible accessibilityLabel={`Total ${fmt(total)} ${units}`} style={{ alignItems: "center" }}>
              <Text style={[s.large, { fontSize: 28, lineHeight: 34 }]}>{fmt(total)}</Text>
              <Text style={s.footnote}>{units} total</Text>
            </View>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Increase total by ${kit.step} ${units}`}
              onPress={() => change(kit.step)}
              scaleTo={0.9}
              style={stepStyle}
            >
              <Ionicons name="add" size={22} color={colors.text} />
            </PressableScale>
          </View>
          <Segmented
            label="Bar weight"
            value={String(bar)}
            onChange={(v) => setBar(Number(v))}
            options={kit.bars.map((b) => ({ value: String(b), title: `${b} ${units} bar` }))}
          />
          {result.belowBar ? (
            <Text style={s.secondary}>
              Less than the bar alone ({bar} {units}).
            </Text>
          ) : result.plates.length ? (
            <>
              <View
                accessible
                accessibilityLabel={`Each side: ${result.plates.map((p) => `${fmt(p)} ${units}`).join(", ")}`}
                style={[s.row, { gap: 4, alignItems: "center", minHeight: 64 }]}
              >
                <View style={{ width: 28, height: 6, borderRadius: 3, backgroundColor: colors.tertiary }} />
                {result.plates.map((p, i) => (
                  <View key={i} style={{ alignItems: "center", gap: 4 }}>
                    <View
                      style={{
                        width: p >= 10 ? 16 : 12,
                        height: plateHeight(p, heaviest),
                        borderRadius: 4,
                        backgroundColor: colors.surface3,
                        borderWidth: 1,
                        borderColor: colors.separator,
                      }}
                    />
                  </View>
                ))}
                <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.tertiary, marginLeft: 2 }} />
              </View>
              <Text style={s.text}>
                Each side: <Text style={[s.text, { fontWeight: "600" }]}>{plateText}</Text> {units}
              </Text>
            </>
          ) : (
            <Text style={s.secondary}>Just the bar.</Text>
          )}
          {result.rest > 0 && !result.belowBar && (
            <Text style={s.footnote}>
              Standard plates can't make the last {fmt(result.rest)} {units}; this loads {fmt(total - result.rest)} {units}.
            </Text>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
}
const stepStyle = {
  width: 52,
  height: 52,
  borderRadius: 26,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  backgroundColor: colors.surface2,
};
