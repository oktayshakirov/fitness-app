import { useSettings } from "../src/storage/store";
import { toDisplayWeight, toKilograms, weightText } from "../src/storage/units";
import { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { AccessibilityInfo, Alert, Keyboard, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, TextInput } from "../src/components/Text";
import { Image } from "expo-image";
import { Icon } from "../src/components/Icon";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, FadeOut, LayoutAnimationConfig, LinearTransition } from "react-native-reanimated";
import { motion } from "../src/components/motion";
import { RestControl } from "../src/components/RestTimer";
import { content, coverFor, exercises, mediaBackground } from "../src/content";
import { Screen, Heading, IconButton, Button, s } from "../src/components/ui";
import { useToast } from "../src/components/Toast";
import {
  deleteEntry,
  getEntries,
  logExercise,
  saveEntry,
} from "../src/storage/store";
import type { TrainingSet } from "../src/storage/types";
import { addDays, dayKey, dayLabel, onDay } from "../src/storage/calendar";
import { setText, setsSummary } from "../src/storage/format";
import { newBest } from "../src/storage/progress";
import { colors, themed, useScheme } from "../src/theme";
export { ScreenError as ErrorBoundary } from "../src/components/ErrorScreen";
/** Stepper button: one step per tap; holding repeats until released. */
function StepButton({ label, icon, onStep }: { label: string; icon: "add" | "remove"; onStep: () => void }) {
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const stop = () => {
    clearInterval(timer.current);
    timer.current = undefined;
  };
  useEffect(() => stop, []);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onStep}
      delayLongPress={350}
      onLongPress={() => {
        void Haptics.selectionAsync();
        onStep();
        stop();
        timer.current = setInterval(onStep, 90);
      }}
      onPressOut={stop}
      style={({ pressed }) => [styles.step, pressed && { opacity: 0.6 }]}
    >
      <Icon name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}
export default function LogSheet() {
  useScheme();
  const settings = useSettings();
  const [units] = useState(settings.units);
  const { exerciseId, entryId } = useLocalSearchParams<{
    exerciseId?: string;
    entryId?: string;
  }>();
  const original = getEntries().find((e) => e.id === entryId);
  const exercise = exercises.find(
    (e) => e.id === (original?.exerciseId ?? exerciseId),
  );
  const last =
    original ?? getEntries().find((e) => e.exerciseId === exerciseId);
  const [expanded, setExpanded] = useState(!!original?.sets.length);
  // Stable row ids, so adding or removing a set animates the right row.
  const nextId = useRef(0);
  const [sets, setSets] = useState(() =>
    (last?.sets.length ? last.sets : [{ reps: 10, weightKg: 0 }]).map((s) => ({
      id: nextId.current++,
      reps: String(s.reps),
      weight: weightText(s.weightKg, units),
      originalWeight: s.weightKg,
      originalDisplay: weightText(s.weightKg, units),
    })),
  );
  const [note, setNote] = useState(original?.note ?? "");
  // The day this log counts for; never later than today.
  const [day, setDay] = useState(() => new Date(original?.timestamp ?? Date.now()));
  const isToday = dayKey(day) >= dayKey(Date.now());
  const moveDay = (delta: number) =>
    setDay((d) => (delta > 0 && dayKey(d) >= dayKey(Date.now()) ? d : addDays(d, delta)));
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardOpen(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  function adjust(index: number, field: "reps" | "weight", delta: number) {
    setSets((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row;
        const current = Number(row[field]);
        const next = Math.max(
          field === "reps" ? 1 : 0,
          Math.min(
            field === "reps" ? 1000 : toDisplayWeight(5000, units),
            (Number.isFinite(current) ? current : 0) + delta,
          ),
        );
        return { ...row, [field]: String(Math.round(next * 100) / 100) };
      }),
    );
  }
  function save() {
    if (busy) return;
    setBusy(true);
    try {
      const values: TrainingSet[] = expanded
        ? sets.map((s) => ({
            reps: Number(s.reps),
            weightKg:
              s.weight === s.originalDisplay
                ? s.originalWeight
                : toKilograms(Number(s.weight), units),
          }))
        : [];
      if (expanded && sets.some((s) => !s.reps.trim() || !s.weight.trim()))
        throw new Error("Fill in reps and weight, or use 0 for bodyweight.");
      const suffix = isToday ? "" : ` · ${dayLabel(day)}`;
      if (original) {
        const moved = dayKey(day) !== dayKey(original.timestamp);
        saveEntry({
          ...original,
          sets: values,
          note,
          timestamp: moved ? onDay(original.timestamp, day) : original.timestamp,
        });
        toast({ text: `Updated${moved ? suffix : ""}`, undo: () => saveEntry(original) });
      } else if (exercise) {
        // Earlier logs of this exercise, read before saving, to spot a new best set.
        const previous = getEntries().filter((e) => e.exerciseId === exercise.id);
        const entry = logExercise(
          exercise,
          values,
          note,
          isToday ? Date.now() : onDay(Date.now(), day),
        );
        const record = newBest(previous, values);
        toast(
          record
            ? { text: `New best: ${setText(record, units)}${suffix}`, icon: "trophy", undo: () => deleteEntry(entry.id) }
            : { text: `Logged${suffix}`, undo: () => deleteEntry(entry.id) },
        );
        if (record) AccessibilityInfo.announceForAccessibility(`New best set: ${setText(record, units)}`);
      } else throw new Error("Exercise unavailable.");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Alert.alert(
        "Could not save",
        error instanceof Error ? error.message : "Please try again.",
      );
      setBusy(false);
    }
  }
  if (!exercise && !original)
    return (
      <Screen>
        <Heading title="Exercise unavailable" />
        <Button title="Close" onPress={() => router.back()} />
      </Screen>
    );
  const cover = exercise && coverFor(exercise, settings.model);
  function field(i: number, kind: "reps" | "weight") {
    const step = kind === "reps" ? 1 : units === "kg" ? 2.5 : 5;
    const name = kind === "reps" ? "reps" : "weight";
    return (
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[s.footnote, { textAlign: "center" }]}>
          {kind === "reps" ? "Reps" : units}
        </Text>
        <View style={styles.stepper}>
          <StepButton label={`Decrease set ${i + 1} ${name}`} icon="remove" onStep={() => adjust(i, kind, -step)} />
          <TextInput
            testID={`log-${kind}-${i}`}
            accessibilityLabel={`Set ${i + 1} ${name}`}
            keyboardType={kind === "reps" ? "number-pad" : "decimal-pad"}
            selectTextOnFocus
            value={sets[i]![kind]}
            onChangeText={(value) =>
              setSets((rows) =>
                rows.map((row, j) =>
                  j === i
                    ? { ...row, [kind]: kind === "weight" ? value.replace(",", ".") : value }
                    : row,
                ),
              )
            }
            style={[s.headline, styles.input]}
          />
          <StepButton label={`Increase set ${i + 1} ${name}`} icon="add" onStep={() => adjust(i, kind, step)} />
        </View>
      </View>
    );
  }
  return (
    <Screen>
      <View style={[s.row, { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }]}>
        {cover && (
          <Image
            source={content.resolve(cover.poster)}
            contentFit="contain"
            style={{ width: 52, height: 65, borderRadius: 16, backgroundColor: mediaBackground }}
          />
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.footnote}>{original ? "Edit log" : "Log exercise"}</Text>
          <Text accessibilityRole="header" numberOfLines={2} style={s.title}>
            {exercise?.name ?? original?.exerciseName}
          </Text>
        </View>
        {keyboardOpen && (
          <IconButton name="checkmark" label="Done editing" onPress={Keyboard.dismiss} />
        )}
        <IconButton name="close" label="Close log" onPress={() => router.back()} />
      </View>
      <View style={{ flex: 1 }}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}
        >
          <View style={[s.row, styles.day]}>
            <IconButton plain name="chevron-back" label="Previous day" onPress={() => moveDay(-1)} />
            <View
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel="Day"
              accessibilityValue={{ text: dayLabel(day) }}
              accessibilityActions={[{ name: "decrement" }, { name: "increment" }]}
              onAccessibilityAction={(e) => moveDay(e.nativeEvent.actionName === "increment" ? 1 : -1)}
              style={[s.row, { flex: 1, justifyContent: "center", gap: 8 }]}
            >
              <Icon name="calendar-outline" size={18} color={isToday ? colors.secondary : colors.accentInk} />
              <Text testID="log-day" style={[s.headline, !isToday && { color: colors.accentInk }]}>
                {dayLabel(day)}
              </Text>
            </View>
            <IconButton plain name="chevron-forward" label="Next day" disabled={isToday} onPress={() => moveDay(1)} />
          </View>
          <Button
            title={original ? "Save changes" : expanded ? `Save ${sets.length} ${sets.length === 1 ? "set" : "sets"}` : "Done"}
            icon="checkmark-circle"
            onPress={save}
            disabled={busy}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            onPress={() => setExpanded(!expanded)}
            style={[s.row, { minHeight: 48, justifyContent: "center", gap: 6 }]}
          >
            <Icon name={expanded ? "remove-circle-outline" : "add-circle-outline"} size={20} color={colors.accentInk} />
            <Text style={{ color: colors.accentInk, fontSize: 16, fontWeight: "500" }}>
              {expanded ? "Log without sets" : "Add sets"}
            </Text>
          </Pressable>
          {!original && !expanded && !!last?.sets.length && (
            <Animated.View entering={FadeIn.duration(motion.base)}>
              <Text style={[s.footnote, { textAlign: "center", marginTop: -8 }]}>
                Last time: {setsSummary(last.sets, units)} · {dayLabel(new Date(last.timestamp))}. Add sets starts from
                these.
              </Text>
            </Animated.View>
          )}
          {expanded && (
            <Animated.View
              entering={FadeIn.duration(motion.base)}
              exiting={FadeOut.duration(motion.fast)}
              style={{ gap: 8 }}
            >
              {/* Rows present when the list opens appear with it; later rows slide in. */}
              <LayoutAnimationConfig skipEntering>
                {sets.map((row, i) => (
                  <Animated.View
                    key={row.id}
                    entering={FadeInDown.duration(motion.base)}
                    exiting={FadeOut.duration(motion.fast)}
                    layout={LinearTransition.duration(motion.base)}
                    style={[s.card, s.row, { padding: 12, gap: 10 }]}
                  >
                    <View style={styles.badge}>
                      <Text style={{ color: colors.onAccent, fontWeight: "700" }}>{i + 1}</Text>
                    </View>
                    {field(i, "reps")}
                    {field(i, "weight")}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove set ${i + 1}`}
                      disabled={sets.length === 1}
                      onPress={() => setSets((rows) => rows.filter((_, j) => j !== i))}
                      hitSlop={8}
                      style={{ opacity: sets.length === 1 ? 0.25 : 1, paddingTop: 18 }}
                    >
                      <Icon name="trash-outline" size={20} color={colors.secondary} />
                    </Pressable>
                  </Animated.View>
                ))}
              </LayoutAnimationConfig>
              <Animated.View layout={LinearTransition.duration(motion.base)}>
                <Button
                  secondary
                  icon="add"
                  title="Add set"
                  disabled={sets.length >= 100}
                  onPress={() => setSets((rows) => [...rows, { ...rows[rows.length - 1]!, id: nextId.current++ }])}
                />
              </Animated.View>
              {/* Rest between sets; the floating pill is hidden behind this sheet, so it shows here. */}
              <Animated.View layout={LinearTransition.duration(motion.base)}>
                <RestControl seconds={settings.restSeconds} />
              </Animated.View>
            </Animated.View>
          )}
          {/* Glides when the set list opens, grows or closes above it. */}
          <Animated.View layout={LinearTransition.duration(motion.base)} style={{ gap: 12 }}>
            <TextInput
              testID="log-note"
              accessibilityLabel="Note"
              placeholder="Add a note (optional)"
              placeholderTextColor={colors.secondary}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={2000}
              style={[s.text, { backgroundColor: colors.surface, borderRadius: 24, padding: 18, minHeight: 96, marginTop: 8, textAlignVertical: "top" }]}
            />
            {original && (
              <Button
                destructive
                icon="trash-outline"
                title="Delete entry"
                onPress={() => {
                  try {
                    deleteEntry(original.id);
                    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    toast({ text: "Deleted", undo: () => saveEntry(original) });
                    router.back();
                  } catch {
                    Alert.alert("Could not delete", "Please try again.");
                  }
                }}
              />
            )}
          </Animated.View>
        </ScrollView>
      </View>
    </Screen>
  );
}
const styles = themed(() => ({
  day: { backgroundColor: colors.surface, borderRadius: 24, minHeight: 52, paddingHorizontal: 4 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface2,
    borderRadius: 24,
    minHeight: 48,
  },
  step: { width: 40, minHeight: 48, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, textAlign: "center", paddingVertical: 10, minWidth: 36 },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
}));
