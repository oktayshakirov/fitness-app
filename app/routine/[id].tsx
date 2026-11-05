import { useMemo } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { Icon } from "../../src/components/Icon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../../src/components/Text";
import { Button, Empty, IconButton, Screen, s } from "../../src/components/ui";
import { ProgressBar } from "../../src/components/motion";
import { useToast } from "../../src/components/Toast";
import { content, coverFor, equipmentSummary, exercises, mediaBackground } from "../../src/content";
import { deleteRoutine, restoreRoutine, useEntries, useRoutines, useSettings } from "../../src/storage/store";
import { doneOn, nextExercise } from "../../src/storage/routines";
import { dayKey } from "../../src/storage/calendar";
import { plural } from "../../src/storage/format";
import { colors } from "../../src/theme";
export { ScreenError as ErrorBoundary } from "../../src/components/ErrorScreen";

/** A routine: today's progress, its exercises in order, and Start / Continue. */
export default function RoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const routines = useRoutines();
  const entries = useEntries();
  const { model } = useSettings();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const routine = routines.find((r) => r.id === id);
  // Exercises still in the library, in routine order.
  const items = useMemo(
    () => (routine ? routine.exercises.flatMap((x) => exercises.filter((e) => e.id === x)) : []),
    [routine],
  );
  if (!routine)
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 12 }}>
          <Empty icon="list" title="Routine not found" description="It may have been deleted." />
          <Button title="Close" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  const done = doneOn(routine, entries, dayKey(Date.now()));
  const doneCount = items.filter((e) => done.has(e.id)).length;
  const ids = items.map((e) => e.id);
  const allDone = items.length > 0 && doneCount === items.length;
  const missing = routine.exercises.length - items.length;
  function open(exerciseId: string) {
    router.push({ pathname: "/exercise/[id]", params: { id: exerciseId, routine: routine!.id } });
  }
  function remove() {
    Alert.alert(`Delete "${routine!.name}"?`, "Your logs stay; only the routine is removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const removed = deleteRoutine(routine!.id);
          router.back();
          if (removed) toast({ text: `Deleted ${removed.name}`, undo: () => restoreRoutine(removed) });
        },
      },
    ]);
  }
  return (
    <Screen>
      <View style={[s.row, { paddingHorizontal: 16, paddingVertical: 6, justifyContent: "space-between" }]}>
        <IconButton name="chevron-back" label="Back" onPress={() => router.back()} />
        <View style={[s.row, { gap: 8 }]}>
          <IconButton
            name="create-outline"
            label="Edit routine"
            onPress={() => router.push({ pathname: "/routine/edit", params: { id: routine.id } })}
          />
          <IconButton name="trash-outline" label="Delete routine" onPress={remove} />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 12, paddingBottom: 24 }}>
        <View style={{ gap: 4, marginBottom: 4 }}>
          <Text style={s.subhead}>Routine</Text>
          <Text accessibilityRole="header" style={s.large}>
            {routine.name}
          </Text>
          <Text style={s.subhead}>
            {plural(items.length, "exercise")} · {doneCount} done today
          </Text>
        </View>
        <ProgressBar value={items.length ? doneCount / items.length : 0} fill={colors.accent} track={colors.surface2} />
        {items.map((e, i) => {
          const isDone = done.has(e.id);
          const cover = coverFor(e, model);
          return (
            <Pressable
              key={e.id}
              accessibilityRole="button"
              accessibilityLabel={`${i + 1}. ${e.name}${isDone ? ", done today" : ""}`}
              onPress={() => open(e.id)}
              style={({ pressed }) => [
                s.card,
                s.row,
                { padding: 8, paddingRight: 16 },
                pressed && { backgroundColor: colors.surface2 },
              ]}
            >
              <Image
                source={content.resolve(cover.poster)}
                contentFit="contain"
                style={{ width: 52, height: 65, borderRadius: 14, backgroundColor: mediaBackground }}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.headline}>{e.name}</Text>
                <Text numberOfLines={1} style={s.footnote}>
                  {equipmentSummary(e)}
                </Text>
              </View>
              {isDone ? (
                <Icon name="checkmark-circle" size={26} color={colors.accent} />
              ) : (
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.surface2,
                  }}
                >
                  <Text style={[s.caption, { color: colors.text }]}>{i + 1}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
        {missing > 0 && (
          <Text style={s.footnote}>
            {plural(missing, "exercise")} in this routine {missing === 1 ? "is" : "are"} no longer in the library.
          </Text>
        )}
        <Text style={[s.footnote, { textAlign: "center", marginTop: 4 }]}>
          On each exercise, log it, start the rest timer, then swipe up for the next one.
        </Text>
      </ScrollView>
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: colors.bg,
        }}
      >
        <Button
          title={doneCount === 0 ? "Start workout" : allDone ? "All done · Start again" : "Continue"}
          arrow
          disabled={!items.length}
          onPress={() => {
            const target = allDone ? ids[0] : nextExercise(ids, done);
            if (target) open(target);
          }}
        />
      </View>
    </Screen>
  );
}
