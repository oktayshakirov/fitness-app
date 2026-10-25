import { Image } from "expo-image";
import { content, exercises, mediaFor } from "../../src/content";
import { Alert } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { deleteEntry, saveEntry } from "../../src/storage/store";
import { useToast } from "../../src/components/Toast";
import { useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  Screen,
  Heading,
  Card,
  IconButton,
  Empty,
  s,
} from "../../src/components/ui";
import { useEntries } from "../../src/storage/store";
import { dayKey, monthDays, streaks } from "../../src/storage/calendar";
import { colors } from "../../src/theme";
import type { LogEntry } from "../../src/storage/types";
function EntryRow({ entry }: { entry: LogEntry }) {
  const toast = useToast();
  const exercise = exercises.find((e) => e.id === entry.exerciseId);
  const views = exercise ? mediaFor(exercise, "male").views : undefined;
  const clip = views && (views.threeq ?? views.side ?? Object.values(views)[0]);
  function remove() {
    try {
      deleteEntry(entry.id);
      toast({ text: "Deleted", undo: () => saveEntry(entry) });
    } catch {
      Alert.alert("Could not delete", "Please try again.");
    }
  }
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
            padding: 20,
            borderRadius: 16,
          }}
        >
          <Text style={s.text}>Delete</Text>
        </Pressable>
      )}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${entry.exerciseName}`}
        onPress={() =>
          router.push({ pathname: "/log", params: { entryId: entry.id } })
        }
      >
        <Card style={s.row}>
          {clip && (
            <Image
              source={content.resolve(clip.poster)}
              style={{ width: 56, height: 70, borderRadius: 8 }}
              contentFit="contain"
            />
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.text}>{entry.exerciseName}</Text>
            <Text style={[s.footnote, { marginTop: 6 }]}>
              {entry.sets.length
                ? entry.sets
                    .map((set) => `${set.reps} × ${set.weightKg} kg`)
                    .join(" · ")
                : "Done"}{" "}
              ·{" "}
              {new Date(entry.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
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
  return (
    <Screen>
      <Heading title="History" />
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: 0,
          gap: 16,
          paddingBottom: 40,
        }}
      >
        <Card>
          <View style={[s.row, { justifyContent: "space-between" }]}>
            <IconButton
              name="chevron-back"
              label="Previous month"
              onPress={() =>
                setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
              }
            />
            <Text style={[s.text, { flexShrink: 1 }]}>
              {month.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </Text>
            <IconButton
              name="chevron-forward"
              label="Next month"
              onPress={() =>
                setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
              }
            />
          </View>
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12 }}
          >
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <Text
                key={i}
                style={[
                  s.footnote,
                  {
                    width: "14.2857%",
                    textAlign: "center",
                    paddingVertical: 8,
                  },
                ]}
              >
                {d}
              </Text>
            ))}
            {monthDays(month).map((date, i) => {
              const key = date ? dayKey(date) : "";
              return (
                <View
                  key={i}
                  style={{
                    width: "14.2857%",
                    minHeight: 44,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {date && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${date.toLocaleDateString()}${days.has(key) ? ", active" : ""}`}
                      accessibilityState={{ selected: key === selected }}
                      onPress={() => setSelected(key)}
                      style={{
                        minHeight: 44,
                        width: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                        borderRadius: 22,
                        backgroundColor: days.has(key)
                          ? colors.accent
                          : key === selected
                            ? colors.surface2
                            : "transparent",
                        borderWidth: key === today ? 1 : 0,
                        borderColor: colors.accent,
                      }}
                    >
                      <Text
                        style={{
                          color: days.has(key) ? colors.bg : colors.text,
                          fontSize: 15,
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
          <View
            style={[
              s.row,
              {
                justifyContent: "space-around",
                marginTop: 20,
                alignItems: "flex-start",
              },
            ]}
          >
            {[
              [stats.activeDays, "Active days"],
              [stats.current, "Day streak"],
              [stats.weekly, "Week streak"],
            ].map(([n, title]) => (
              <View
                key={title}
                style={{ flex: 1, alignItems: "center", gap: 4 }}
              >
                <Text style={[s.title, { color: colors.accent }]}>{n}</Text>
                <Text style={s.footnote}>{title}</Text>
              </View>
            ))}
          </View>
        </Card>
        <Text style={s.title}>{selected === today ? "Today" : selected}</Text>
        {entries
          .filter((e) => dayKey(e.timestamp) === selected)
          .map((e) => (
            <EntryRow key={e.id} entry={e} />
          ))}
        {!entries.some((e) => dayKey(e.timestamp) === selected) && (
          <Empty
            title="No exercises logged"
            description="Log an exercise to see it here."
          />
        )}
        <Text style={s.title}>Recent</Text>
        {entries.slice(0, 20).map((e) => (
          <EntryRow key={e.id} entry={e} />
        ))}
      </ScrollView>
    </Screen>
  );
}
