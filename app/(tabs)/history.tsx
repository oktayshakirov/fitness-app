import { useState } from "react";
import { router } from "expo-router";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Text } from "../../src/components/Text";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Screen, Heading, Card, IconButton, Empty, Button, IconCircle, SectionTitle, s } from "../../src/components/ui";
import { useToast } from "../../src/components/Toast";
import { content, coverFor, exercises, mediaBackground } from "../../src/content";
import { deleteEntry, saveEntry, useEntries, useSettings } from "../../src/storage/store";
import { dayKey, monthDays, streaks } from "../../src/storage/calendar";
import { weightText } from "../../src/storage/units";
import type { LogEntry } from "../../src/storage/types";
import { colors, tabBarSpace } from "../../src/theme";
function EntryRow({ entry, showDate = false }: { entry: LogEntry; showDate?: boolean }) {
  const { model, units } = useSettings();
  const toast = useToast();
  const exercise = exercises.find((e) => e.id === entry.exerciseId);
  const clip = exercise && coverFor(exercise, model);
  function remove() {
    try {
      deleteEntry(entry.id);
      toast({ text: "Deleted", undo: () => saveEntry(entry) });
    } catch {
      Alert.alert("Could not delete", "Please try again.");
    }
  }
  const when = new Date(entry.timestamp);
  return (
    <ReanimatedSwipeable
      renderRightActions={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${entry.exerciseName}`}
          onPress={remove}
          style={{
            backgroundColor: colors.trained,
            justifyContent: "center",
            alignItems: "center",
            width: 88,
            marginLeft: 8,
            borderRadius: 24,
          }}
        >
          <Ionicons name="trash-outline" size={22} color={colors.text} />
        </Pressable>
      )}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${entry.exerciseName}`}
        accessibilityHint="Opens this log. Use the Delete accessibility action to remove it."
        accessibilityActions={[{ name: "delete", label: "Delete log" }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "delete") remove();
        }}
        onPress={() => router.push({ pathname: "/log", params: { entryId: entry.id } })}
      >
        <Card style={[s.row, { padding: 8, paddingRight: 16 }]}>
          {clip ? (
            <Image
              source={content.resolve(clip.poster)}
              style={{ width: 56, height: 70, borderRadius: 16, backgroundColor: mediaBackground }}
              contentFit="contain"
            />
          ) : (
            <View style={{ width: 56, height: 70, borderRadius: 16, backgroundColor: colors.surface2 }} />
          )}
          <View style={{ flex: 1, gap: 6, alignItems: "flex-start" }}>
            <Text style={s.headline}>{entry.exerciseName}</Text>
            <View style={[s.row, { gap: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, backgroundColor: colors.accent }]}>
              <Ionicons name={entry.sets.length ? "barbell" : "checkmark"} size={12} color={colors.onAccent} />
              <Text style={[s.caption, { color: colors.onAccent }]}>
                {entry.sets.length ? `${entry.sets.length} ${entry.sets.length === 1 ? "set" : "sets"}` : "Done"}
              </Text>
            </View>
            {!!entry.sets.length && (
              <Text style={s.footnote} numberOfLines={1}>
                {entry.sets.map((set) => `${set.reps} × ${weightText(set.weightKg, units)} ${units}`).join(" · ")}
              </Text>
            )}
          </View>
          <Text style={s.footnote}>
            {showDate
              ? when.toLocaleDateString(undefined, { month: "short", day: "numeric" })
              : when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </Card>
      </Pressable>
    </ReanimatedSwipeable>
  );
}
export default function History() {
  const entries = useEntries();
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(dayKey(Date.now()));
  const stats = streaks(entries, new Date(), month);
  const days = new Set(entries.map((e) => dayKey(e.timestamp)));
  const today = dayKey(Date.now());
  const dayEntries = entries.filter((e) => dayKey(e.timestamp) === selected);
  const recent = entries.filter((e) => dayKey(e.timestamp) !== selected).slice(0, 20);
  const selectedDate = new Date(`${selected}T12:00:00`);
  return (
    <Screen>
      <Heading eyebrow="Your training" title="History" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 0, gap: 12, paddingBottom: tabBarSpace }}>
        <View style={[s.row, { gap: 10 }]}>
          {(
            [
              [stats.activeDays, "Active days", "this month", "calendar"],
              [stats.current, "Day streak", "in a row", "flame"],
              [stats.weekly, "Week streak", "weeks", "trophy"],
            ] as const
          ).map(([n, title, unit, icon]) => (
            <View key={title} style={[s.card, { flex: 1, padding: 14, gap: 6 }]}>
              <IconCircle name={icon} size={32} />
              <Text style={[s.large, { fontSize: 26, lineHeight: 32, marginTop: 4 }]}>{n}</Text>
              <Text numberOfLines={1} style={[s.footnote, { color: colors.text }]}>
                {title}
              </Text>
              <Text numberOfLines={1} style={[s.footnote, { fontSize: 12 }]}>
                {unit}
              </Text>
            </View>
          ))}
        </View>
        <Card style={{ paddingHorizontal: 8 }}>
          <View style={[s.row, { justifyContent: "space-between" }]}>
            <IconButton
              plain
              name="chevron-back"
              label="Previous month"
              onPress={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            />
            <Text style={[s.headline, { flexShrink: 1 }]}>
              {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </Text>
            <IconButton
              plain
              name="chevron-forward"
              label="Next month"
              onPress={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            />
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <Text
                key={i}
                style={[s.footnote, { width: "14.2857%", textAlign: "center", paddingVertical: 6, fontSize: 12 }]}
              >
                {d}
              </Text>
            ))}
            {monthDays(month).map((date, i) => {
              const key = date ? dayKey(date) : "";
              const active = days.has(key);
              const isSelected = key === selected;
              return (
                <View
                  key={i}
                  style={{ width: "14.2857%", height: 44, alignItems: "center", justifyContent: "center" }}
                >
                  {date && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}${key === today ? ", today" : ""}${active ? ", active" : ""}`}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => setSelected(key)}
                      style={{
                        width: 40,
                        height: 40,
                        justifyContent: "center",
                        alignItems: "center",
                        borderRadius: 20,
                        backgroundColor: active ? colors.accent : isSelected ? colors.surface3 : "transparent",
                        borderWidth: isSelected && active ? 2 : key === today ? 1.5 : 0,
                        borderColor: isSelected && active ? colors.text : colors.accent,
                      }}
                    >
                      <Text
                        style={{
                          color: active ? colors.onAccent : colors.text,
                          fontSize: 15,
                          fontWeight: active || key === today ? "700" : "400",
                        }}
                      >
                        {date.getDate()}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        </Card>
        <SectionTitle
          title={
            selected === today
              ? "Today"
              : selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
          }
        />
        {dayEntries.map((e) => (
          <EntryRow key={e.id} entry={e} />
        ))}
        {!dayEntries.length && (
          <Empty
            icon="barbell-outline"
            title="Nothing logged"
            description={selected === today ? "Log an exercise and it shows up here." : "No exercises on this day."}
          />
        )}
        {!entries.length && (
          <Button title="Browse exercises" onPress={() => router.navigate("/(tabs)/exercises")} />
        )}
        {!!recent.length && (
          <>
                <SectionTitle title="Recent" />
            {recent.map((e) => (
              <EntryRow key={e.id} entry={e} showDate />
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
