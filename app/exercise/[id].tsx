import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useEntries } from "../../src/storage/store";
import { Asset } from "expo-asset";
import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, Pressable, Text, View, useWindowDimensions } from "react-native";
import {
  Screen,
  IconButton,
  Chip,
  Card,
  Button,
  s,
} from "../../src/components/ui";
import { ExerciseVideo } from "../../src/components/ExerciseVideo";
import {
  content,
  exercises,
  label,
  mediaFor,
  viewLabels,
} from "../../src/content";
import { filterExercises } from "../../src/content/query";
import type { CameraView } from "../../src/content/types";
import { colors } from "../../src/theme";
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
  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={[s.row, { minHeight: 44, justifyContent: "space-between" }]}
      >
        <Text style={s.title}>{title}</Text>
        <Text style={s.secondary}>{open ? "−" : "+"}</Text>
      </Pressable>
      {open &&
        lines.map((line, i) => (
          <Text key={i} style={[s.secondary, { marginTop: 12 }]}>
            {numbered ? `${i + 1}. ` : ""}
            {line}
          </Text>
        ))}
    </Card>
  );
}
export default function ExerciseDetail() {
  const params = useLocalSearchParams<{
    id: string;
    muscle?: string;
    equipment?: string;
    query?: string;
  }>();
  const list = useMemo(() => {
    const requested = exercises.find((e) => e.id === params.id);
    if (!requested) return [];
    const filtered = filterExercises(exercises, params);
    return filtered.some((e) => e.id === requested.id) ? filtered : [requested];
  }, [params.id, params.muscle, params.equipment, params.query]);
  const initial = list.findIndex((e) => e.id === params.id);
  const [index, setIndex] = useState(Math.max(0, initial));
  const exercise = list[index];
  const entries = useEntries();
  const last = entries.find((entry) => entry.exerciseId === exercise?.id);
  useEffect(() => {
    setIndex(Math.max(0, initial));
  }, [initial, params.id]);
  const [view, setView] = useState<CameraView>("threeq");
  const [visible, setVisible] = useState(true);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const { width } = useWindowDimensions();
  useEffect(() => {
    const next = list[index + 1];
    if (!next) return;
    const views = mediaFor(next, "male").views;
    const clip = views.threeq ?? views.side ?? Object.values(views)[0];
    if (!clip) return;
    for (const asset of [clip.poster, clip.video]) {
      const source = content.resolve(asset);
      if (typeof source === "number")
        void Asset.fromModule(source)
          .downloadAsync()
          .catch(() => {});
    }
  }, [index, list]);
  function move(delta: number) {
    const next = index + delta;
    if (next >= 0 && next < list.length) {
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
  const media = mediaFor(exercise, "male").views;
  const selected = media[view]
    ? view
    : media.threeq
      ? "threeq"
      : (Object.keys(media)[0] as CameraView);
  const current = media[selected]!;
  return (
    <Screen>
      <View
        style={[
          s.row,
          {
            paddingHorizontal: 20,
            paddingVertical: 8,
            justifyContent: "space-between",
          },
        ]}
      >
        <IconButton
          name="close"
          label="Close exercise"
          onPress={() => router.back()}
        />
        <Text style={s.footnote}>
          {index + 1} of {list.length}
        </Text>
        <View style={s.row}>
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
          onScroll={(e) =>
            setVisible(e.nativeEvent.contentOffset.y < (width - 40) * 1.25 - 40)
          }
          scrollEventThrottle={32}
          contentContainerStyle={{
            padding: 20,
            paddingTop: 4,
            gap: 20,
            paddingBottom: 40,
          }}
        >
          <GestureDetector gesture={gesture}>
            <View collapsable={false}>
              <ExerciseVideo media={current} visible={visible} />
            </View>
          </GestureDetector>
          <View style={[s.row, { justifyContent: "center", flexWrap: "wrap" }]}>
            {(Object.keys(media) as CameraView[]).map((v) => (
              <Chip
                key={v}
                title={viewLabels[v]}
                selected={selected === v}
                onPress={() => setView(v)}
              />
            ))}
          </View>
          <View key={exercise.id} style={{ gap: 20 }}>
            <View style={{ gap: 8 }}>
              <Text accessibilityRole="header" style={s.large}>
                {exercise.name}
              </Text>
              <Text style={s.secondary}>
                {exercise.equipment.map(label).join(" · ")}
              </Text>
            </View>
            <View style={{ gap: 8 }}>
              <Text style={s.footnote}>MUSCLES WORKED</Text>
              <View style={[s.row, { flexWrap: "wrap" }]}>
                {exercise.primary.map((m) => (
                  <Text key={m} style={{ color: colors.trained, fontSize: 15 }}>
                    ● {label(m)}
                  </Text>
                ))}
                {exercise.secondary.map((m) => (
                  <Text
                    key={m}
                    style={{ color: colors.recovering, fontSize: 15 }}
                  >
                    ● {label(m)}
                  </Text>
                ))}
              </View>
            </View>
            {last && (
              <Text style={s.footnote}>
                Last:{" "}
                {last.sets.length
                  ? last.sets
                      .map((set) => `${set.reps} × ${set.weightKg} kg`)
                      .join(" · ")
                  : "Done"}{" "}
                ·{" "}
                {new Date(last.timestamp).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            )}
            <Section title="How to" lines={exercise.steps} numbered initial />
            <Section title="Cues" lines={exercise.cues} />
            <Section title="Common mistakes" lines={exercise.mistakes} />
            <Section title="Breathing" lines={[exercise.breathing]} />
          </View>
        </ScrollView>
      </GestureDetector>
      <View
        style={{ padding: 20, paddingBottom: 32, backgroundColor: colors.bg }}
      >
        <Button
          title="Log"
          onPress={() =>
            router.push({
              pathname: "/log",
              params: { exerciseId: exercise.id },
            })
          }
        />
      </View>
    </Screen>
  );
}
