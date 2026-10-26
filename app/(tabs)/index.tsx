import { useSettings } from "../../src/storage/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppState,
  Alert,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { FlashList, type ViewToken } from "@shopify/flash-list";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from "react-native-reanimated";
import {
  Screen,
  Heading,
  IconButton,
  Chip,
  Card,
  s,
} from "../../src/components/ui";
import { content, exercises, label } from "../../src/content";
import {
  muscleIds,
  type Muscle,
  type MediaAsset,
} from "../../src/content/types";
import { useEntries } from "../../src/storage/store";
import { recovery, type RecoveryState } from "../../src/recovery/engine";
import { colors } from "../../src/theme";
const names: Record<RecoveryState, string> = {
  trained: "Trained",
  recovering: "Recovering",
  almost: "Almost ready",
  ready: "Ready",
};
const tints: Record<RecoveryState, string> = {
  trained: colors.trained,
  recovering: colors.recovering,
  almost: colors.almost,
  ready: colors.ready,
};
const posterior = new Set<Muscle>([
  "hamstrings",
  "glutes",
  "calves",
  "lats",
  "traps",
  "middle_back",
  "lower_back",
  "triceps",
]);
function Mask({
  asset,
  tint,
  focused,
}: {
  asset: MediaAsset;
  tint: string;
  focused: boolean;
}) {
  const reduced = useReducedMotion();
  const style = useAnimatedStyle(
    () => ({
      opacity: withTiming(focused ? 0.9 : 0.55, {
        duration: reduced ? 0 : 150,
      }),
    }),
    [focused, reduced],
  );
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", inset: 0 }, style]}
    >
      <Image
        source={content.resolve(asset)}
        tintColor={focused ? colors.accent : tint}
        contentFit="contain"
        style={{ width: "100%", height: "100%" }}
      />
    </Animated.View>
  );
}
export default function Body() {
  const { model, recoverySpeed } = useSettings();
  const entries = useEntries();
  const [now, setNow] = useState(Date.now());
  const [side, setSide] = useState<"front" | "back">("front");
  const [focused, setFocused] = useState<Muscle>("chest");
  const { height } = useWindowDimensions();
  useEffect(() => setNow(Date.now()), [entries]);
  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      const timer = setInterval(() => setNow(Date.now()), 60000);
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") setNow(Date.now());
      });
      return () => {
        clearInterval(timer);
        subscription.remove();
      };
    }, []),
  );
  const status = useMemo(
    () => recovery(entries, now, recoverySpeed),
    [entries, now, recoverySpeed],
  );
  const body =
    content.release.bodymap[model] ??
    content.release.bodymap.male ??
    content.release.bodymap.female;
  const figure = body?.[side];
  const examples = useMemo(
    () =>
      Object.fromEntries(
        muscleIds.map((m) => [
          m,
          exercises
            .filter((e) => e.primary.includes(m))
            .slice(0, 2)
            .map((e) => e.name)
            .join(" · "),
        ]),
      ),
    [],
  );
  const focusRow = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<Muscle>[] }) => {
      const muscle = viewableItems.find((item) => item.isViewable)?.item;
      if (muscle) {
        setFocused(muscle);
        setSide(posterior.has(muscle) ? "back" : "front");
      }
    },
    [],
  );
  const open = (muscle?: Muscle) =>
    router.push({
      pathname: "/(tabs)/exercises",
      params: { muscle: muscle ?? "" },
    });
  return (
    <Screen>
      <Heading
        title="Body"
        action={
          <View style={s.row}>
            <IconButton
              name="information-circle-outline"
              label="About recovery"
              onPress={() =>
                Alert.alert(
                  "Recovery estimates",
                  "Logs add estimated muscle fatigue. Done-only counts as half a session; 30 total reps reaches the per-entry cap. Primary muscles count fully, secondary muscles half. Fatigue fades over 48–72 hours, depending on the muscle. Weight does not affect this estimate. These are estimates, not medical advice.",
                )
              }
            />
            <IconButton
              name="settings-outline"
              label="Settings"
              onPress={() => router.push("/settings")}
            />
          </View>
        }
      />
      {figure ? (
        <View style={{ paddingHorizontal: 20 }}>
          <View style={[s.row, { justifyContent: "center" }]}>
            {(["front", "back"] as const)
              .filter((v) => body?.[v])
              .map((v) => (
                <Chip
                  key={v}
                  title={label(v)}
                  selected={side === v}
                  onPress={() => setSide(v)}
                />
              ))}
          </View>
          <View
            accessibilityLabel={`${label(side)} body, ${label(focused)} highlighted`}
            style={{ height: Math.min(height * 0.4, 360), marginTop: 8 }}
          >
            <Image
              source={content.resolve(figure.base)}
              contentFit="contain"
              style={{ width: "100%", height: "100%" }}
            />
            {muscleIds.map(
              (m) =>
                figure.masks[m] && (
                  <Mask
                    key={m}
                    asset={figure.masks[m]!}
                    tint={tints[status[m].state]}
                    focused={m === focused}
                  />
                ),
            )}
          </View>
        </View>
      ) : (
        <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
          <Card>
            <Text style={s.title}>
              {entries.length ? "Your recovery" : "Ready when you are"}
            </Text>
            <Text style={[s.secondary, { marginTop: 8 }]}>
              {entries.length
                ? "See how each muscle is recovering below."
                : "Log an exercise to see your muscle recovery."}
            </Text>
          </Card>
        </View>
      )}
      <View
        style={[
          s.row,
          { paddingHorizontal: 20, flexWrap: "wrap", marginBottom: 12 },
        ]}
      >
        {(["trained", "recovering", "almost", "ready"] as const).map(
          (state) => (
            <Text key={state} style={s.footnote}>
              <Text
                style={{
                  color: state === "ready" ? colors.accent : tints[state],
                }}
              >
                ●{" "}
              </Text>
              {names[state]}
            </Text>
          ),
        )}
      </View>
      <FlashList
        data={[...muscleIds]}
        keyExtractor={(item) => item}
        onViewableItemsChanged={focusRow}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 60,
          minimumViewTime: 100,
        }}
        extraData={{ status, focused }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ListHeaderComponent={
          <Pressable
            accessibilityRole="button"
            onPress={() => open()}
            style={{ minHeight: 48, justifyContent: "center" }}
          >
            <Text style={{ color: colors.accent, fontSize: 17 }}>
              All exercises →
            </Text>
          </Pressable>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label(item)}, ${names[status[item].state]}`}
            onPress={() => open(item)}
            style={{ marginBottom: 10 }}
          >
            <Card>
              <View style={[s.row, { justifyContent: "space-between" }]}>
                <Text style={s.text}>{label(item)}</Text>
                <Text style={s.secondary}>›</Text>
              </View>
              <Text
                style={{
                  color:
                    status[item].state === "ready"
                      ? colors.accent
                      : tints[status[item].state],
                  fontSize: 13,
                  marginTop: 6,
                }}
              >
                {names[status[item].state]}
                {status[item].readyInHours
                  ? ` · ready in ~${status[item].readyInHours} h`
                  : ""}
              </Text>
              {!!examples[item] && (
                <Text numberOfLines={2} style={[s.footnote, { marginTop: 6 }]}>
                  {examples[item]}
                </Text>
              )}
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
