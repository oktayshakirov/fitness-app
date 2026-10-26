import { useSettings } from "../src/storage/store";
import { toDisplayWeight, toKilograms, weightText } from "../src/storage/units";
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  Alert,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { exercises } from "../src/content";
import {
  Screen,
  Heading,
  IconButton,
  Button,
  Card,
  s,
} from "../src/components/ui";
import { useToast } from "../src/components/Toast";
import {
  deleteEntry,
  getEntries,
  logExercise,
  saveEntry,
} from "../src/storage/store";
import type { TrainingSet } from "../src/storage/types";
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
      if (original) {
        saveEntry({ ...original, sets: values, note });
        toast({ text: "Updated", undo: () => saveEntry(original) });
      } else if (exercise) {
        const entry = logExercise(exercise, values, note);
        toast({ text: "Logged", undo: () => deleteEntry(entry.id) });
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
  return (
    <Screen>
      <Heading
        title={original ? "Edit log" : "Log exercise"}
        action={
          <View style={s.row}>
            {keyboardOpen && (
              <IconButton
                name="checkmark"
                label="Done editing"
                onPress={Keyboard.dismiss}
              />
            )}
            <IconButton
              name="close"
              label="Close log"
              onPress={() => router.back()}
            />
          </View>
        }
      />
      <View style={{ flex: 1 }}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}
        >
          <Text style={s.title}>
            {exercise?.name ?? original?.exerciseName}
          </Text>
          <Button
            title={original ? "Save changes" : "Done"}
            onPress={save}
            disabled={busy}
          />
          <Button
            secondary
            title={expanded ? "Log without sets" : "Add sets"}
            onPress={() => setExpanded(!expanded)}
          />
          {expanded && (
            <Card>
              <View style={{ gap: 16 }}>
                {sets.map((set, i) => (
                  <View key={i} style={s.row}>
                    <Text style={s.footnote}>{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.footnote}>Reps</Text>
                      <TextInput
                        testID={`log-reps-${i}`}
                        accessibilityLabel={`Set ${i + 1} reps`}
                        keyboardType="number-pad"
                        selectTextOnFocus
                        value={set.reps}
                        onChangeText={(value) =>
                          setSets((rows) =>
                            rows.map((row, j) =>
                              j === i ? { ...row, reps: value } : row,
                            ),
                          )
                        }
                        style={[
                          s.text,
                          {
                            backgroundColor: colors.surface2,
                            borderRadius: 8,
                            padding: 12,
                            minHeight: 48,
                          },
                        ]}
                      />
                      <View
                        style={[s.row, { justifyContent: "space-between" }]}
                      >
                        <IconButton
                          name="remove"
                          label={`Decrease set ${i + 1} reps`}
                          onPress={() => adjust(i, "reps", -1)}
                        />
                        <IconButton
                          name="add"
                          label={`Increase set ${i + 1} reps`}
                          onPress={() => adjust(i, "reps", 1)}
                        />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.footnote}>{units}</Text>
                      <TextInput
                        testID={`log-weight-${i}`}
                        accessibilityLabel={`Set ${i + 1} weight`}
                        keyboardType="decimal-pad"
                        selectTextOnFocus
                        value={set.weight}
                        onChangeText={(value) =>
                          setSets((rows) =>
                            rows.map((row, j) =>
                              j === i
                                ? { ...row, weight: value.replace(",", ".") }
                                : row,
                            ),
                          )
                        }
                        style={[
                          s.text,
                          {
                            backgroundColor: colors.surface2,
                            borderRadius: 8,
                            padding: 12,
                            minHeight: 48,
                          },
                        ]}
                      />
                      <View
                        style={[s.row, { justifyContent: "space-between" }]}
                      >
                        <IconButton
                          name="remove"
                          label={`Decrease set ${i + 1} weight`}
                          onPress={() =>
                            adjust(i, "weight", units === "kg" ? -2.5 : -5)
                          }
                        />
                        <IconButton
                          name="add"
                          label={`Increase set ${i + 1} weight`}
                          onPress={() =>
                            adjust(i, "weight", units === "kg" ? 2.5 : 5)
                          }
                        />
                      </View>
                    </View>
                    <IconButton
                      name="remove"
                      label={`Remove set ${i + 1}`}
                      disabled={sets.length === 1}
                      onPress={() =>
                        setSets((rows) => rows.filter((_, j) => j !== i))
                      }
                    />
                  </View>
                ))}
                <Button
                  secondary
                  title="Add set"
                  disabled={sets.length >= 100}
                  onPress={() =>
                    setSets((rows) => [...rows, { ...rows[rows.length - 1]! }])
                  }
                />
              </View>
            </Card>
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
            style={[
              s.text,
              {
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                minHeight: 88,
              },
            ]}
          />
          {original && (
            <Button
              secondary
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
