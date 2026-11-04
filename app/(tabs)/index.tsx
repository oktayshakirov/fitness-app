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
  Button,
  s,
} from "../../src/components/ui";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { BodyFigure } from "../../src/components/BodyFigure";
import { PressableScale, ProgressBar, motion } from "../../src/components/motion";
import { Avatar } from "../../src/components/Avatar";
import { bodyFor, content, coverFor, exercises, label, mediaBackground } from "../../src/content";
import { muscleIds, type Muscle } from "../../src/content/types";
import { useEntries, useRoutines, useSettings } from "../../src/storage/store";
import { doneOn } from "../../src/storage/routines";
import { suggestExercises } from "../../src/recovery/suggest";
import { Image } from "expo-image";
import { dayKey, streaks, weekDays } from "../../src/storage/calendar";
import { plural } from "../../src/storage/format";
import { recovery } from "../../src/recovery/engine";
import { readyIn, stateColors, stateNames } from "../../src/recovery/labels";
import { colors, tabBarSpace } from "../../src/theme";
export { ScreenError as ErrorBoundary } from "../../src/components/ErrorScreen";
const counts = Object.fromEntries(
  muscleIds.map((m) => [
    m,
    exercises.filter((e) => [...e.primary, ...e.secondary].includes(m)).length,
  ]),
) as Record<Muscle, number>;
/** Mon–Sun bars: lime for days with a log, outlined today. */
function WeekStrip({ days, today }: { days: { key: string; active: boolean }[]; today: string }) {
  return (
    <View style={[s.row, { gap: 4 }]}>
      {days.map(({ key, active }) => (
        <View
          key={key}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            backgroundColor: active ? colors.accent : key > today ? colors.surface2 : colors.surface3,
            borderWidth: key === today && !active ? 1 : 0,
            borderColor: colors.accent,
          }}
        />
      ))}
    </View>
  );
}
function greeting(hour: number) {
  return hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}
export default function Home() {
  const { model, recoverySpeed, weeklyGoal, favorites } = useSettings();
  const routines = useRoutines();
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
  // Training days this week (several exercises in one session are one day).
  const today = dayKey(now);
  const trained = new Set(entries.filter((e) => e.timestamp <= now).map((e) => dayKey(e.timestamp)));
  const week = weekDays(new Date(now)).map((d) => ({
    key: dayKey(d),
    name: d.toLocaleDateString(undefined, { weekday: "long" }),
    active: trained.has(dayKey(d)),
  }));
  const thisWeek = week.filter((d) => d.active);
  const goalMet = thisWeek.length >= weeklyGoal;
  // Exercises for fully recovered muscles, rested longest first.
  const suggestions = useMemo(
    () => suggestExercises(exercises, status, entries, favorites),
    [status, entries, favorites],
  );
  const body = bodyFor(model);
  const figure = body?.[side];
  const tints = Object.fromEntries(
    muscleIds.filter((m) => status[m].state !== "ready").map((m) => [m, stateColors[status[m].state]]),
  );
  function select(muscle: Muscle | undefined) {
    if (!muscle && !focused) return;
    void Haptics.selectionAsync();
    // Tapping the selected muscle again, or outside the body, clears the selection.
    setFocused(muscle === focused ? undefined : muscle);
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
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`${readyShare}% of muscles ready. Open exercises.`}
            onPress={() => open()}
            scaleTo={0.98}
            style={{ backgroundColor: colors.accent, borderRadius: 24, padding: 18, gap: 14 }}
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
            <ProgressBar value={readyShare / 100} fill={colors.onAccent} track="rgba(11,11,12,0.15)" />
          </PressableScale>
          <View style={[s.row, { gap: 12, alignItems: "stretch" }]}>
            <Stat
              label="Day streak"
              value={stats.current}
              unit={stats.current === 1 ? "day" : "days"}
              icon="flame"
              onPress={() => router.navigate("/(tabs)/history")}
              hint="Opens History"
              footer={
                <Text numberOfLines={1} style={s.footnote}>
                  {stats.longest ? `Best: ${plural(stats.longest, "day")}` : "Log today to start"}
                </Text>
              }
            />
            <Stat
              label="This week"
              value={thisWeek.length}
              unit={`of ${weeklyGoal} days`}
              icon={goalMet ? "trophy" : "barbell"}
              onPress={() => router.navigate("/(tabs)/history")}
              hint="Opens History"
              description={`${goalMet ? "Weekly goal reached." : `${weeklyGoal - thisWeek.length} to go for your goal.`}${thisWeek.length ? ` Trained ${thisWeek.map((d) => d.name).join(", ")}.` : ""}`}
              footer={<WeekStrip days={week} today={today} />}
            />
          </View>
          <SectionTitle
            title="Routines"
            action={routines.length ? "New" : undefined}
            onAction={() => router.push("/routine/edit")}
          />
          {routines.length ? (
            <View style={[s.card, { padding: 0, overflow: "hidden" }]}>
              {routines.map((r, i) => {
                const total = r.exercises.filter((x) => exercises.some((e) => e.id === x)).length;
                const done = doneOn(r, entries, today).size;
                const complete = total > 0 && done >= total;
                return (
                  <Pressable
                    key={r.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${r.name}, ${plural(total, "exercise")}, ${done} done today`}
                    onPress={() => router.push({ pathname: "/routine/[id]", params: { id: r.id } })}
                    style={({ pressed }) => ({ backgroundColor: pressed ? colors.surface2 : "transparent" })}
                  >
                    {i > 0 && <View style={{ height: 1, backgroundColor: colors.separator, marginLeft: 66 }} />}
                    <View style={[s.row, { minHeight: 64, paddingHorizontal: 16, gap: 14 }]}>
                      <IconCircle name={complete ? "checkmark" : "list"} size={36} dim={!complete} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.headline}>{r.name}</Text>
                        <Text style={s.footnote}>
                          {plural(total, "exercise")}
                          {done ? ` · ${done} done today` : ""}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.tertiary} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={[s.card, { gap: 14 }]}>
              <View style={[s.row, { gap: 14 }]}>
                <IconCircle name="list" size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={s.headline}>Build a routine</Text>
                  <Text style={s.footnote}>Save the exercises you train together and start them in one tap.</Text>
                </View>
              </View>
              <Button secondary icon="add" title="Create a routine" onPress={() => router.push("/routine/edit")} />
            </View>
          )}
          {suggestions.length > 0 && (
            <>
              <SectionTitle title="Ready to train" />
              <View style={[s.card, { padding: 0, overflow: "hidden" }]}>
                {suggestions.map(({ exercise, muscle, lastTrained }, i) => {
                  const rested = lastTrained
                    ? `rested ${plural(Math.max(1, Math.floor((now - lastTrained) / 86_400_000)), "day")}`
                    : "not trained yet";
                  return (
                    <Pressable
                      key={exercise.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${exercise.name}, for ${label(muscle)}, ${rested}`}
                      onPress={() => router.push({ pathname: "/exercise/[id]", params: { id: exercise.id } })}
                      style={({ pressed }) => ({ backgroundColor: pressed ? colors.surface2 : "transparent" })}
                    >
                      {i > 0 && <View style={{ height: 1, backgroundColor: colors.separator, marginLeft: 72 }} />}
                      <View style={[s.row, { minHeight: 72, paddingHorizontal: 12, gap: 12 }]}>
                        <Image
                          source={content.resolve(coverFor(exercise, model).poster)}
                          contentFit="contain"
                          style={{ width: 44, height: 55, borderRadius: 12, backgroundColor: mediaBackground }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={s.headline}>{exercise.name}</Text>
                          <Text style={s.footnote}>
                            {label(muscle)} · {rested}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.tertiary} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
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
                {/* Front/Back cross-fade: the old view fades out on top while the new one fades in. */}
                <Animated.View
                  key={side}
                  entering={FadeIn.duration(motion.base)}
                  exiting={FadeOut.duration(motion.fast)}
                >
                  <BodyFigure
                    view={figure}
                    tints={tints}
                    focused={focused}
                    onPressMuscle={select}
                    accessibilityLabel={`${label(side)} body${focused ? `, ${label(focused)} selected` : ""}`}
                    style={{ height: Math.min(height * 0.42, 400), marginTop: 6 }}
                  />
                </Animated.View>
                <View style={[s.row, { justifyContent: "center", flexWrap: "wrap", gap: 12, marginTop: 6 }]}>
                  {(["trained", "recovering", "almost", "ready"] as const).map((state) => (
                    <View key={state} style={[s.row, { gap: 5 }]}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: stateColors[state] }} />
                      <Text style={s.caption}>{stateNames[state]}</Text>
                    </View>
                  ))}
                </View>
                {focused ? (
                  <Animated.View key={focused} entering={FadeIn.duration(motion.fast)}>
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
                          {status[focused].readyInHours ? ` · ${readyIn(status[focused].readyInHours)}` : ""}
                        </Text>
                      </View>
                      <Text style={[s.subhead, { color: colors.accent }]}>{counts[focused]} exercises</Text>
                      <Ionicons name="chevron-forward" size={18} color={colors.accent} />
                    </Pressable>
                  </Animated.View>
                ) : (
                  <Animated.View entering={FadeIn.duration(motion.fast)}>
                    <Text style={[s.footnote, { textAlign: "center", marginTop: 12 }]}>
                      Tap a muscle to see its exercises
                    </Text>
                  </Animated.View>
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
                        {readyInHours ? ` · ${readyIn(readyInHours)}` : ""}
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
