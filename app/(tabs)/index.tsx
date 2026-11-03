import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, Alert, Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Text } from "../../src/components/Text";
import {
  Screen,
  Heading,
  IconButton,
  IconCircle,
  Segmented,
  SectionTitle,
  Stat,
  s,
} from "../../src/components/ui";
import { BodyFigure } from "../../src/components/BodyFigure";
import { Avatar } from "../../src/components/Avatar";
import { bodyFor, exercises, label } from "../../src/content";
import { muscleIds, type Muscle } from "../../src/content/types";
import { useEntries, useSettings } from "../../src/storage/store";
import { streaks, weekDays } from "../../src/storage/calendar";
import { recovery } from "../../src/recovery/engine";
import { stateColors, stateNames } from "../../src/recovery/labels";
import { colors, tabBarSpace } from "../../src/theme";
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
const counts = Object.fromEntries(
  muscleIds.map((m) => [
    m,
    exercises.filter((e) => [...e.primary, ...e.secondary].includes(m)).length,
  ]),
) as Record<Muscle, number>;
function greeting(hour: number) {
  return hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}
export default function Home() {
  const { model, recoverySpeed } = useSettings();
  const entries = useEntries();
  const [now, setNow] = useState(Date.now());
  const [side, setSide] = useState<"front" | "back">("front");
  const [focused, setFocused] = useState<Muscle>();
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
  const status = useMemo(() => recovery(entries, now, recoverySpeed), [entries, now, recoverySpeed]);
  // Muscles that need rest first (most fatigued on top), then the rest in body order.
  const muscles = useMemo(
    () =>
      [...muscleIds].sort(
        (a, b) =>
          Number(status[b].state !== "ready") - Number(status[a].state !== "ready") ||
          status[b].fatigue - status[a].fatigue,
      ),
    [status],
  );
  const resting = muscles.filter((m) => status[m].state !== "ready");
  const readyShare = Math.round(((muscleIds.length - resting.length) / muscleIds.length) * 100);
  const stats = streaks(entries, new Date(now));
  const weekStart = weekDays(new Date(now))[0]!;
  weekStart.setHours(0, 0, 0, 0);
  const thisWeek = entries.filter((e) => e.timestamp >= weekStart.getTime() && e.timestamp <= now).length;
  const body = bodyFor(model);
  const figure = body?.[side];
  const tints = Object.fromEntries(
    muscleIds.filter((m) => status[m].state !== "ready").map((m) => [m, stateColors[status[m].state]]),
  );
  function select(muscle: Muscle) {
    void Haptics.selectionAsync();
    setFocused(muscle);
  }
  const open = (muscle?: Muscle) =>
    router.push({ pathname: "/(tabs)/exercises", params: { muscle: muscle ?? "" } });
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: tabBarSpace, gap: 14 }}>
        <Heading
          eyebrow={greeting(new Date(now).getHours())}
          title="Ready to train?"
          action={
            <View style={[s.row, { gap: 8 }]}>
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open profile"
                onPress={() => router.navigate("/(tabs)/profile")}
              >
                <Avatar model={model} size={44} />
              </Pressable>
            </View>
          }
        />
        <View style={{ paddingHorizontal: 20, gap: 14 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${readyShare}% of muscles ready. Open exercises.`}
            onPress={() => open()}
            style={({ pressed }) => ({
              backgroundColor: colors.accent,
              borderRadius: 24,
              padding: 18,
              gap: 14,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <View style={[s.row, { gap: 10 }]}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  borderWidth: 1.5,
                  borderColor: colors.onAccent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="pulse" size={17} color={colors.onAccent} />
              </View>
              <Text style={[s.subhead, { color: colors.onAccent, fontWeight: "500", flex: 1 }]}>
                Muscle recovery
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.onAccent} />
            </View>
            <View style={[s.row, { alignItems: "flex-end", justifyContent: "space-between" }]}>
              <Text style={{ color: colors.onAccent, fontSize: 18, fontWeight: "600", lineHeight: 24, flex: 1 }}>
                {!entries.length
                  ? "Log an exercise to start tracking"
                  : resting.length
                    ? `Resting: ${resting.slice(0, 3).map(label).join(", ")}${resting.length > 3 ? ` +${resting.length - 3}` : ""}`
                    : "Everything is ready to train"}
              </Text>
              <Text style={{ color: colors.onAccent, fontSize: 40, fontWeight: "700", lineHeight: 46 }}>
                {readyShare}
                <Text style={{ color: colors.onAccent, fontSize: 16, fontWeight: "600" }}>% ready</Text>
              </Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: "rgba(11,11,12,0.15)" }}>
              <View style={{ width: `${readyShare}%`, height: 8, borderRadius: 4, backgroundColor: colors.onAccent }} />
            </View>
          </Pressable>
          <View style={[s.row, { gap: 12, alignItems: "stretch" }]}>
            <Stat label="Day streak" value={stats.current} unit={stats.current === 1 ? "day" : "days"} icon="flame" />
            <Stat label="This week" value={thisWeek} unit={thisWeek === 1 ? "workout" : "workouts"} icon="barbell" />
          </View>
          {figure && (
            <>
              <SectionTitle title="Body map" />
              <View style={[s.card, { padding: 14 }]}>
                <View style={{ alignSelf: "center", width: 200 }}>
                  <Segmented
                    label="Body side"
                    value={side}
                    onChange={setSide}
                    options={[
                      { value: "front", title: "Front" },
                      { value: "back", title: "Back" },
                    ]}
                  />
                </View>
                <BodyFigure
                  view={figure}
                  tints={tints}
                  focused={focused}
                  onPressMuscle={select}
                  accessibilityLabel={`${label(side)} body${focused ? `, ${label(focused)} selected` : ""}`}
                  style={{ height: Math.min(height * 0.42, 400), marginTop: 6 }}
                />
                <View style={[s.row, { justifyContent: "center", flexWrap: "wrap", gap: 12, marginTop: 6 }]}>
                  {(["trained", "recovering", "almost", "ready"] as const).map((state) => (
                    <View key={state} style={[s.row, { gap: 5 }]}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: stateColors[state] }} />
                      <Text style={s.caption}>{stateNames[state]}</Text>
                    </View>
                  ))}
                </View>
                {focused ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => open(focused)}
                    style={({ pressed }) => [
                      s.row,
                      {
                        marginTop: 14,
                        padding: 12,
                        borderRadius: 18,
                        backgroundColor: pressed ? colors.surface3 : colors.surface2,
                      },
                    ]}
                  >
                    <View
                      style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: stateColors[status[focused].state] }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={s.headline}>{label(focused)}</Text>
                      <Text style={s.footnote}>
                        {stateNames[status[focused].state]}
                        {status[focused].readyInHours ? ` · ready in ~${status[focused].readyInHours} h` : ""}
                      </Text>
                    </View>
                    <Text style={[s.subhead, { color: colors.accent }]}>{counts[focused]} exercises</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.accent} />
                  </Pressable>
                ) : (
                  <Text style={[s.footnote, { textAlign: "center", marginTop: 12 }]}>
                    Tap a muscle to see its exercises
                  </Text>
                )}
              </View>
            </>
          )}
          <SectionTitle title="Muscles" action="All exercises" onAction={() => open()} />
          <View style={[s.card, { padding: 0, overflow: "hidden" }]}>
            {muscles.map((item, index) => {
              const { state, readyInHours } = status[item];
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityLabel={`${label(item)}, ${stateNames[state]}, ${counts[item]} exercises`}
                  onPress={() => open(item)}
                  style={({ pressed }) => ({ backgroundColor: pressed ? colors.surface2 : "transparent" })}
                >
                  {index > 0 && <View style={{ height: 1, backgroundColor: colors.separator, marginLeft: 66 }} />}
                  <View style={[s.row, { minHeight: 64, paddingHorizontal: 16, gap: 14 }]}>
                    <IconCircle
                      name={state === "ready" ? "checkmark" : state === "trained" ? "flame" : "hourglass-outline"}
                      size={36}
                      dim={state === "ready"}
                      color={state === "ready" ? undefined : stateColors[state]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={s.headline}>{label(item)}</Text>
                      <Text style={[s.footnote, state !== "ready" && { color: stateColors[state] }]}>
                        {stateNames[state]}
                        {readyInHours ? ` · ready in ~${readyInHours} h` : ""}
                      </Text>
                    </View>
                    {counts[item] > 0 && (
                      <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, backgroundColor: colors.surface2 }}>
                        <Text style={s.caption}>{counts[item]}</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={18} color={colors.tertiary} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
