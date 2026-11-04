import { useSettings } from "../src/storage/store";
import { toDisplayWeight, toKilograms, weightText } from "../src/storage/units";
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, Keyboard, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, TextInput } from "../src/components/Text";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
import { setsSummary } from "../src/storage/format";
import { colors } from "../src/theme";
export default function LogSheet() {
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
  const [sets, setSets] = useState(
    (last?.sets.length ? last.sets : [{ reps: 10, weightKg: 0 }]).map((s) => ({
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
        const entry = logExercise(
          exercise,
          values,
          note,
          isToday ? Date.now() : onDay(Date.now(), day),
        );
        toast({ text: `Logged${suffix}`, undo: () => deleteEntry(entry.id) });
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Decrease set ${i + 1} ${name}`}
            onPress={() => adjust(i, kind, -step)}
            style={styles.step}
          >
            <Ionicons name="remove" size={20} color={colors.text} />
          </Pressable>
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Increase set ${i + 1} ${name}`}
            onPress={() => adjust(i, kind, step)}
            style={styles.step}
          >
            <Ionicons name="add" size={20} color={colors.text} />
          </Pressable>
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
              <Ionicons name="calendar-outline" size={18} color={isToday ? colors.secondary : colors.accent} />
              <Text testID="log-day" style={[s.headline, !isToday && { color: colors.accent }]}>
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
            <Ionicons name={expanded ? "remove-circle-outline" : "add-circle-outline"} size={20} color={colors.accent} />
            <Text style={{ color: colors.accent, fontSize: 16, fontWeight: "500" }}>
              {expanded ? "Log without sets" : "Add sets"}
            </Text>
          </Pressable>
          {!original && !expanded && !!last?.sets.length && (
            <Text style={[s.footnote, { textAlign: "center", marginTop: -8 }]}>
              Last time: {setsSummary(last.sets, units)} · {dayLabel(new Date(last.timestamp))}. Add sets starts from these.
            </Text>
          )}
          {expanded && (
            <View style={{ gap: 8 }}>
              {sets.map((_, i) => (
                <View key={i} style={[s.card, s.row, { padding: 12, gap: 10 }]}>
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
                    <Ionicons name="trash-outline" size={20} color={colors.secondary} />
                  </Pressable>
                </View>
              ))}
              <Button
                secondary
                icon="add"
                title="Add set"
                disabled={sets.length >= 100}
                onPress={() => setSets((rows) => [...rows, { ...rows[rows.length - 1]! }])}
              />
            </View>
          )}
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
                  toast({ text: "Deleted", undo: () => saveEntry(original) });
                  router.back();
                } catch {
                  Alert.alert("Could not delete", "Please try again.");
                }
              }}
            />
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
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
});
