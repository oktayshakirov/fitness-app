import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { Text } from "../../src/components/Text";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { motion } from "../../src/components/motion";
import { Screen, IconButton, Button, SectionLabel, s } from "../../src/components/ui";
import { AnglePicker } from "../../src/components/AnglePicker";
import { RestStartButton } from "../../src/components/RestTimer";
import { ExerciseVideo } from "../../src/components/ExerciseVideo";
import { BodyFigure } from "../../src/components/BodyFigure";
import {
  bodyFor,
  content,
  coverFor,
  equipmentSummary,
  exercises,
  filterCatalog,
  label,
  mediaFor,
  viewOrder,
} from "../../src/content";
import type { CameraView, Muscle } from "../../src/content/types";
import { getRoutines, updateSettings, useEntries, useSettings } from "../../src/storage/store";
import { oneRepMax } from "../../src/storage/progress";
import { toDisplayWeight } from "../../src/storage/units";
import { ProgressChart } from "../../src/components/ProgressChart";
import { PlateCalculator } from "../../src/components/PlateCalculator";
import * as Haptics from "expo-haptics";
import { bestSet, setText, setsSummary } from "../../src/storage/format";
import { colors } from "../../src/theme";
export { ScreenError as ErrorBoundary } from "../../src/components/ErrorScreen";
function Section({
  title,
  lines,
  numbered = false,
  initial = false,
}: {
  title: string;
  lines: string[];
  numbered?: boolean;
  initial?: boolean;
}) {
  const [open, setOpen] = useState(initial);
  const turn = useSharedValue(initial ? 180 : 0);
  useEffect(() => {
    turn.value = withTiming(open ? 180 : 0, { duration: motion.base });
  }, [open, turn]);
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));
  return (
    // The card animates its height change and the cards below glide instead of jumping.
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
        <Text style={[s.headline, { flex: 1 }]}>{title}</Text>
        <Animated.View style={chevron}>
          <Ionicons name="chevron-down" size={18} color={colors.secondary} />
        </Animated.View>
      </Pressable>
      {open && (
        <Animated.View entering={FadeIn.duration(motion.base)} style={{ gap: 12, paddingBottom: 16 }}>
          {lines.map((line, i) => (
            <View key={i} style={[s.row, { alignItems: "flex-start", gap: 10 }]}>
              {numbered ? (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: colors.accentDim,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "700" }}>
                    {i + 1}
                  </Text>
                </View>
              ) : (
                <Text style={[s.secondary, { width: 12 }]}>•</Text>
              )}
              <Text style={[s.secondary, { flex: 1 }]}>{line}</Text>
            </View>
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}
/** The angle last picked stays selected for the next exercise opened in this session. */
let preferredView: CameraView = "threeq";
const shortDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
function MuscleLine({ muscles, color, title }: { muscles: Muscle[]; color: string; title: string }) {
  if (!muscles.length) return null;
  return (
    <View style={{ gap: 6 }}>
      <SectionLabel title={title} />
      <View style={[s.row, { flexWrap: "wrap", gap: 6 }]}>
        {muscles.map((m) => (
          <Pressable
            key={m}
            accessibilityRole="button"
            accessibilityLabel={`${label(m)} exercises`}
            onPress={() => router.navigate({ pathname: "/(tabs)/exercises", params: { muscle: m } })}
            style={[
              s.row,
              { gap: 6, paddingHorizontal: 10, minHeight: 32, borderRadius: 16, backgroundColor: colors.surface2 },
            ]}
          >
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
            <Text style={{ color: colors.text, fontSize: 14 }}>{label(m)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
export default function ExerciseDetail() {
  const { model, units, restSeconds, favorites } = useSettings();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id: string;
    muscle?: string;
    equipment?: string;
    query?: string;
    /** "1" when opened from the Favorites filter. */
    favorites?: string;
    /** Routine id when opened from a routine: previous/next walk its exercises in order. */
    routine?: string;
  }>();
  // Favourites as they were when the screen opened, so un-starring does not reshuffle the list.
  const [startFavorites] = useState(favorites);
  const routine = params.routine ? getRoutines().find((r) => r.id === params.routine) : undefined;
  const list = useMemo(() => {
    const requested = exercises.find((e) => e.id === params.id);
    if (!requested) return [];
    const candidates = routine
      ? routine.exercises.flatMap((id) => exercises.filter((e) => e.id === id))
      : filterCatalog(params).filter((e) => params.favorites !== "1" || startFavorites.includes(e.id));
    return candidates.some((e) => e.id === requested.id) ? candidates : [requested];
  }, [params.id, params.muscle, params.equipment, params.query, params.favorites, routine, startFavorites]);
  const initial = list.findIndex((e) => e.id === params.id);
  const [index, setIndex] = useState(Math.max(0, initial));
  // Direction of the last previous/next move; the info block slides in from that side.
  const [direction, setDirection] = useState(0);
  const exercise = list[index];
  const entries = useEntries();
  const history = useMemo(
    () => entries.filter((entry) => entry.exerciseId === exercise?.id),
    [entries, exercise?.id],
  );
  const last = history[0];
  // Only worth a line once there is more than one logged session with sets.
  const best = history.filter((e) => e.sets.length).length > 1 ? bestSet(history) : undefined;
  useEffect(() => {
    setIndex(Math.max(0, initial));
  }, [initial, params.id]);
  const [view, setView] = useState<CameraView>(preferredView);
  const chooseView = (next: CameraView) => {
    preferredView = next;
    setView(next);
  };
  const [visible, setVisible] = useState(true);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const { width } = useWindowDimensions();
  useEffect(() => {
    const next = list[index + 1];
    if (!next) return;
    const clip = coverFor(next, model);
    for (const asset of [clip.poster, clip.video]) {
      const source = content.resolve(asset);
      if (typeof source === "number")
        void Asset.fromModule(source)
          .downloadAsync()
          .catch(() => {});
    }
  }, [index, list, model]);
  function move(delta: number) {
    const next = index + delta;
    if (next >= 0 && next < list.length) {
      setDirection(delta);
      setIndex(next);
      setVisible(true);
      scroll.current?.scrollTo({ y: 0, animated: false });
    }
  }
  const nativeScroll = Gesture.Native();
  const gesture = Gesture.Pan()
    .minDistance(20)
    .blocksExternalGesture(nativeScroll)
    .runOnJS(true)
    .onEnd(({ translationX: dx, translationY: dy }) => {
      if (dx > 80 && Math.abs(dy) < 60) router.back();
      else if (dy < -60) move(1);
      else if (dy > 60) move(-1);
    });
  if (!exercise)
    return (
      <Screen>
        <Text style={s.text}>Exercise not found</Text>
        <IconButton name="close" label="Close" onPress={() => router.back()} />
      </Screen>
    );
  const isFavorite = favorites.includes(exercise.id);
  function toggleFavorite() {
    if (!exercise) return;
    void Haptics.selectionAsync();
    try {
      updateSettings({
        favorites: isFavorite ? favorites.filter((id) => id !== exercise.id) : [...favorites, exercise.id],
      });
    } catch {
      // Settings write failed; the star simply stays as it was.
    }
  }
  const estimate = best ? oneRepMax(best.set) : undefined;
  const heaviestLogged = history.flatMap((e) => e.sets).reduce((m, set) => Math.max(m, set.weightKg), 0);
  const media = mediaFor(exercise, model).views;
  const views = viewOrder.filter((v) => media[v]);
  const selected = media[view] ? view : views[0]!;
  const current = media[selected]!;
  const body = bodyFor(model);
  const tints = Object.fromEntries([
    ...exercise.secondary.map((m) => [m, colors.recovering]),
    ...exercise.primary.map((m) => [m, colors.trained]),
  ]);
  return (
    <Screen>
      <View style={[s.row, { paddingHorizontal: 16, paddingVertical: 6, justifyContent: "space-between" }]}>
        <IconButton name="close" label="Close exercise" onPress={() => router.back()} />
        <Text numberOfLines={1} style={[s.footnote, { flexShrink: 1, textAlign: "center" }]}>
          {routine ? `${routine.name} · ` : ""}
          {index + 1} of {list.length}
        </Text>
        <View style={[s.row, { gap: 8 }]}>
          <IconButton
            name={isFavorite ? "star" : "star-outline"}
            color={isFavorite ? colors.accent : colors.text}
            selected={isFavorite}
            label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            onPress={toggleFavorite}
          />
          <IconButton
            name="chevron-up"
            label="Previous exercise"
            disabled={index === 0}
            onPress={() => move(-1)}
          />
          <IconButton
            name="chevron-down"
            label="Next exercise"
            disabled={index >= list.length - 1}
            onPress={() => move(1)}
          />
        </View>
      </View>
      <GestureDetector gesture={nativeScroll}>
        <ScrollView
          ref={scroll}
          onScroll={(e) => setVisible(e.nativeEvent.contentOffset.y < (width - 32) * 1.25 - 40)}
          scrollEventThrottle={32}
          contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 16, paddingBottom: 32 }}
        >
          <GestureDetector gesture={gesture}>
            <View collapsable={false}>
              <ExerciseVideo media={current} visible={visible} />
            </View>
          </GestureDetector>
          <AnglePicker media={media} value={selected} onChange={chooseView} />
          <Animated.View
            key={exercise.id}
            entering={
              direction > 0
                ? FadeInDown.duration(motion.base)
                : direction < 0
                  ? FadeInUp.duration(motion.base)
                  : undefined
            }
            style={{ gap: 16 }}
          >
            <View style={{ gap: 4, paddingHorizontal: 4 }}>
              <Text accessibilityRole="header" style={[s.large, { fontSize: 26, lineHeight: 34 }]}>
                {exercise.name}
              </Text>
              <View style={[s.row, { flexWrap: "wrap", gap: 8, marginTop: 8 }]}>
                {(
                  [
                    ["videocam", `${views.length} ${views.length === 1 ? "angle" : "angles"}`, false],
                    ["barbell", equipmentSummary(exercise), false],
                    ["flash", exercise.primary.map(label).join(", "), true],
                  ] as const
                ).map(([icon, text, lime]) => (
                  <View
                    key={icon}
                    style={[
                      s.row,
                      {
                        gap: 6,
                        paddingHorizontal: 12,
                        minHeight: 32,
                        borderRadius: 16,
                        backgroundColor: lime ? colors.accent : "transparent",
                        borderWidth: 1,
                        borderColor: lime ? colors.accent : colors.surface3,
                      },
                    ]}
                  >
                    <Ionicons name={icon} size={14} color={lime ? colors.onAccent : colors.secondary} />
                    <Text style={[s.caption, { color: lime ? colors.onAccent : colors.text }]}>{text}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={[s.card, s.row, { alignItems: "center" }]}>
              <View style={{ flex: 1, gap: 12 }}>
                <MuscleLine title="Primary" muscles={exercise.primary} color={colors.trained} />
                <MuscleLine title="Secondary" muscles={exercise.secondary} color={colors.recovering} />
              </View>
              {body?.front && body.back && (
                <View style={{ flexDirection: "row" }}>
                  {(["front", "back"] as const).map((side) => (
                    <BodyFigure
                      key={side}
                      view={body[side]!}
                      tints={tints}
                      accessibilityLabel={`${label(side)} body with worked muscles highlighted`}
                      style={{ width: 76, height: 95 }}
                    />
                  ))}
                </View>
              )}
            </View>
            {last && (
              <View style={{ gap: 6, paddingHorizontal: 4 }}>
                <View style={[s.row, { gap: 8 }]}>
                  <Ionicons name="time-outline" size={16} color={colors.secondary} />
                  <Text style={[s.footnote, { flex: 1 }]}>
                    Last: {last.sets.length ? setsSummary(last.sets, units) : "Done"} · {shortDate(last.timestamp)}
                  </Text>
                </View>
                {best && (
                  <View style={[s.row, { gap: 8 }]}>
                    <Ionicons name="trophy-outline" size={16} color={colors.accent} />
                    <Text style={[s.footnote, { flex: 1 }]}>
                      Best set: <Text style={[s.footnote, { color: colors.text }]}>{setText(best.set, units)}</Text> ·{" "}
                      {shortDate(best.timestamp)}
                      {estimate ? ` · est. 1RM ${Math.round(toDisplayWeight(estimate, units))} ${units}` : ""}
                    </Text>
                  </View>
                )}
              </View>
            )}
            <ProgressChart entries={history} units={units} />
            {exercise.equipment.includes("barbell") && (
              <PlateCalculator
                units={units}
                startWeight={heaviestLogged ? toDisplayWeight(heaviestLogged, units) : undefined}
              />
            )}
            <Section title="How to" lines={exercise.steps} numbered initial />
            <Section title="Cues" lines={exercise.cues} />
            <Section title="Common mistakes" lines={exercise.mistakes} />
            <Section title="Breathing" lines={[exercise.breathing]} />
            {history.length > 1 && (
              <Section
                title={`Your sessions (${history.length})`}
                lines={[
                  ...history
                    .slice(0, 10)
                    .map((e) => `${shortDate(e.timestamp)} · ${e.sets.length ? setsSummary(e.sets, units) : "Done"}`),
                  ...(history.length > 10 ? [`${history.length - 10} earlier sessions are in History.`] : []),
                ]}
              />
            )}
          </Animated.View>
        </ScrollView>
      </GestureDetector>
      <View
        style={[
          s.row,
          {
            gap: 10,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: colors.bg,
          },
        ]}
      >
        <RestStartButton seconds={restSeconds} />
        <View style={{ flex: 1 }}>
          <Button
            title="Log this exercise"
            arrow
            onPress={() => router.push({ pathname: "/log", params: { exerciseId: exercise.id } })}
          />
        </View>
      </View>
    </Screen>
  );
}
