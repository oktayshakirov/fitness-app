import { useRef, useState, type ComponentRef } from "react";
import { router } from "expo-router";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Text } from "../../src/components/Text";
import { Image } from "expo-image";
import { Icon } from "../../src/components/Icon";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInLeft, FadeInRight, LinearTransition } from "react-native-reanimated";
import { motion } from "../../src/components/motion";
import {
  Screen,
  Heading,
  Card,
  IconButton,
  Empty,
  Button,
  IconCircle,
  PillButton,
  SectionTitle,
  s,
} from "../../src/components/ui";
import { useToast } from "../../src/components/Toast";
import { content, coverFor, exercises, mediaBackground } from "../../src/content";
import { deleteEntry, saveEntry, useEntries, useSettings } from "../../src/storage/store";
import { dayKey, dayLabel, monthDays, streaks } from "../../src/storage/calendar";
import { plural, setsSummary } from "../../src/storage/format";
import type { LogEntry } from "../../src/storage/types";
import { colors, tabBarSpace } from "../../src/theme";
import { AdBanner } from "../../src/components/AdBanner";
export { ScreenError as ErrorBoundary } from "../../src/components/ErrorScreen";
function EntryRow({ entry }: { entry: LogEntry }) {
  const { model, units } = useSettings();
  const toast = useToast();
  const exercise = exercises.find((e) => e.id === entry.exerciseId);
  const clip = exercise && coverFor(exercise, model);
  function remove() {
    try {
      deleteEntry(entry.id);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      toast({ text: "Deleted", undo: () => saveEntry(entry) });
    } catch {
      Alert.alert("Could not delete", "Please try again.");
    }
  }
  const when = new Date(entry.timestamp);
  return (
    // Rows glide into place when one above is deleted or restored.
    <Animated.View layout={LinearTransition.duration(motion.base)}>
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
            <Icon name="trash-outline" size={22} color={colors.text} />
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
                <Icon name={entry.sets.length ? "barbell" : "checkmark"} size={12} color={colors.onAccent} />
                <Text style={[s.caption, { color: colors.onAccent }]}>
                  {entry.sets.length ? `${entry.sets.length} ${entry.sets.length === 1 ? "set" : "sets"}` : "Done"}
                </Text>
              </View>
              {!!entry.sets.length && (
                <Text style={s.footnote} numberOfLines={2}>
                  {setsSummary(entry.sets, units)}
                </Text>
              )}
              {!!entry.note.trim() && (
                <View style={[s.row, { gap: 5, alignItems: "flex-start" }]}>
                  <Icon name="document-text-outline" size={13} color={colors.secondary} style={{ marginTop: 2 }} />
                  <Text style={[s.footnote, { flex: 1 }]} numberOfLines={2}>
                    {entry.note.trim()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={s.footnote}>{when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
          </Card>
        </Pressable>
      </ReanimatedSwipeable>
    </Animated.View>
  );
}
export default function History() {
  const entries = useEntries();
  const [month, setMonth] = useState(new Date());
  // Which way the calendar last paged, so the new month slides in from that side.
  const [monthMove, setMonthMove] = useState(0);
  function showMonth(date: Date) {
    const target = new Date(date.getFullYear(), date.getMonth(), 1);
    const delta = target.getFullYear() * 12 + target.getMonth() - (month.getFullYear() * 12 + month.getMonth());
    if (!delta) return;
    setMonthMove(Math.sign(delta));
    setMonth(target);
  }
  const [selected, setSelected] = useState(dayKey(Date.now()));
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const stats = streaks(entries, new Date(), month);
  const days = new Set(entries.map((e) => dayKey(e.timestamp)));
  const today = dayKey(Date.now());
  const dayEntries = entries.filter((e) => dayKey(e.timestamp) === selected);
  // Last 30 logs outside the selected day, grouped under a heading per day (newest first).
  const recent: [string, LogEntry[]][] = [];
  for (const e of entries.filter((e) => dayKey(e.timestamp) !== selected).slice(0, 30)) {
    const key = dayKey(e.timestamp);
    const group = recent[recent.length - 1];
    if (group?.[0] === key) group[1].push(e);
    else recent.push([key, [e]]);
  }
  const selectedDate = new Date(`${selected}T12:00:00`);
  const now = new Date();
  const onCurrentMonth = month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();
  const daySets = dayEntries.reduce((n, e) => n + e.sets.length, 0);
  const dayExercises = new Set(dayEntries.map((e) => e.exerciseId)).size;
  return (
    <Screen>
      <AdBanner />
      <Heading
        eyebrow="Your training"
        title="History"
        action={
          (!onCurrentMonth || selected !== today) && (
            <PillButton
              title="Today"
              label="Go to today"
              onPress={() => {
                showMonth(new Date());
                setSelected(today);
              }}
            />
          )
        }
      />
      <ScrollView
        ref={scroll}
        contentContainerStyle={{ padding: 20, paddingTop: 0, gap: 12, paddingBottom: tabBarSpace }}
      >
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
              onPress={() => showMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            />
            <Text style={[s.headline, { flexShrink: 1 }]}>
              {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </Text>
            <IconButton
              plain
              name="chevron-forward"
              label="Next month"
              disabled={onCurrentMonth}
              onPress={() => showMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
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
          </View>
          <Animated.View
            key={`${month.getFullYear()}-${month.getMonth()}`}
            entering={
              monthMove > 0
                ? FadeInRight.duration(motion.base)
                : monthMove < 0
                  ? FadeInLeft.duration(motion.base)
                  : undefined
            }
            style={{ flexDirection: "row", flexWrap: "wrap" }}
          >
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
          </Animated.View>
        </Card>
        {/* Sections below the calendar glide together when its height or a list changes. */}
        <Animated.View layout={LinearTransition.duration(motion.base)} style={{ gap: 12 }}>
          <SectionTitle
            title={
              selected === today
                ? "Today"
                : selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
            }
          />
          <Animated.View key={selected} entering={FadeIn.duration(motion.fast)} style={{ gap: 12 }}>
            {!!dayEntries.length && (
              <Text style={[s.footnote, { marginTop: -6 }]}>
                {plural(dayExercises, "exercise")}
                {daySets ? ` · ${plural(daySets, "set")}` : ""}
              </Text>
            )}
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
          </Animated.View>
          {!entries.length && (
            <Button title="Browse exercises" onPress={() => router.navigate("/(tabs)/exercises")} />
          )}
        </Animated.View>
        {!!recent.length && (
          <Animated.View layout={LinearTransition.duration(motion.base)} style={{ gap: 12 }}>
            <SectionTitle title="Recent" />
            {recent.map(([key, group]) => (
              <Animated.View key={key} layout={LinearTransition.duration(motion.base)} style={{ gap: 10 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${dayLabel(new Date(`${key}T12:00:00`))}, ${plural(group.length, "log")}. Show this day`}
                  onPress={() => {
                    setSelected(key);
                    showMonth(new Date(`${key}T12:00:00`));
                    scroll.current?.scrollTo({ y: 0, animated: true });
                  }}
                  style={[s.row, { justifyContent: "space-between", minHeight: 32, marginTop: 4 }]}
                >
                  <Text style={[s.subhead, { color: colors.text, fontWeight: "500" }]}>
                    {dayLabel(new Date(`${key}T12:00:00`))}
                  </Text>
                  <Text style={s.footnote}>{plural(group.length, "log")}</Text>
                </Pressable>
                {group.map((e) => (
                  <EntryRow key={e.id} entry={e} />
                ))}
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </Screen>
  );
}
