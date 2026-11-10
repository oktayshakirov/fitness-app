import { useCallback, useMemo, useState } from "react";
import { Alert, BackHandler, Pressable, ScrollView, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { Icon } from "../../src/components/Icon";
import * as Haptics from "expo-haptics";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, TextInput } from "../../src/components/Text";
import { Button, IconButton, Screen, SectionTitle, s } from "../../src/components/ui";
import { motion } from "../../src/components/motion";
import { content, coverFor, equipmentSummary, exercises, filterCatalog, mediaBackground } from "../../src/content";
import { getRoutines, saveRoutine, useSettings } from "../../src/storage/store";
import { move, routineLimits } from "../../src/storage/routines";
import { colors, useScheme } from "../../src/theme";
export { ScreenError as ErrorBoundary } from "../../src/components/ErrorScreen";

/** Create (no id) or edit a routine: a name, exercises in order, and a searchable catalog to add from. */
export default function RoutineEditor() {
  useScheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [existing] = useState(() => (id ? getRoutines().find((r) => r.id === id) : undefined));
  const { model } = useSettings();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(existing?.name ?? "");
  // Ids no longer in the library are dropped on save; they cannot be trained anyway.
  const [selected, setSelected] = useState<string[]>(
    () => existing?.exercises.filter((x) => exercises.some((e) => e.id === x)) ?? [],
  );
  const [query, setQuery] = useState("");
  const results = useMemo(() => filterCatalog({ query }), [query]);
  const dirty = name !== (existing?.name ?? "") || selected.join() !== (existing?.exercises.join() ?? "");
  const valid = name.trim().length > 0 && selected.length > 0;
  const byId = (exerciseId: string) => exercises.find((e) => e.id === exerciseId);
  function toggle(exerciseId: string) {
    void Haptics.selectionAsync();
    setSelected((current) =>
      current.includes(exerciseId)
        ? current.filter((x) => x !== exerciseId)
        : current.length >= routineLimits.exercises
          ? current
          : [...current, exerciseId],
    );
  }
  function save() {
    try {
      const saved = saveRoutine({ id: existing?.id, name, exercises: selected });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (existing) router.back();
      else router.replace({ pathname: "/routine/[id]", params: { id: saved.id } });
    } catch (error) {
      Alert.alert("Could not save routine", error instanceof Error ? error.message : "Please try again.");
    }
  }
  const close = useCallback(() => {
    if (!dirty) return router.back();
    Alert.alert("Discard changes?", "Your changes to this routine will be lost.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => router.back() },
    ]);
  }, [dirty]);
  // Android back asks too while there are unsaved changes.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (!dirty) return false;
        close();
        return true;
      });
      return () => sub.remove();
    }, [dirty, close]),
  );
  return (
    <Screen>
      <View style={[s.row, { paddingHorizontal: 16, paddingVertical: 6 }]}>
        <IconButton name="close" label="Close" onPress={close} />
        <Text accessibilityRole="header" style={[s.title, { flex: 1, textAlign: "center", marginRight: 44 }]}>
          {existing ? "Edit routine" : "New routine"}
        </Text>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 10, paddingBottom: 24 }}
      >
        <TextInput
          testID="routine-name"
          accessibilityLabel="Routine name"
          placeholder="Name, e.g. Push day"
          placeholderTextColor={colors.secondary}
          value={name}
          onChangeText={setName}
          maxLength={routineLimits.name}
          autoFocus={!existing}
          returnKeyType="done"
          style={[s.text, { backgroundColor: colors.surface, borderRadius: 24, paddingHorizontal: 18, minHeight: 56 }]}
        />
        <SectionTitle title={`In this routine (${selected.length})`} />
        {!selected.length && (
          <Text style={s.footnote}>Tap exercises below to add them in the order you train them.</Text>
        )}
        {selected.map((exerciseId, i) => {
          const e = byId(exerciseId);
          if (!e) return null;
          return (
            <Animated.View
              key={exerciseId}
              layout={LinearTransition.duration(motion.base)}
              style={[s.card, s.row, { padding: 6, paddingLeft: 14, gap: 8 }]}
            >
              <Text style={[s.headline, { width: 22, color: colors.accentInk }]}>{i + 1}</Text>
              <Text numberOfLines={2} style={[s.headline, { flex: 1 }]}>
                {e.name}
              </Text>
              <IconButton
                plain
                name="chevron-up"
                label={`Move ${e.name} up`}
                disabled={i === 0}
                onPress={() => setSelected((list) => move(list, i, i - 1))}
              />
              <IconButton
                plain
                name="chevron-down"
                label={`Move ${e.name} down`}
                disabled={i === selected.length - 1}
                onPress={() => setSelected((list) => move(list, i, i + 1))}
              />
              <IconButton plain name="close" label={`Remove ${e.name}`} onPress={() => toggle(exerciseId)} />
            </Animated.View>
          );
        })}
        <SectionTitle title="Add exercises" />
        <View
          style={[
            s.row,
            { backgroundColor: colors.surface, borderRadius: 26, paddingHorizontal: 18, borderWidth: 1, borderColor: colors.separator },
          ]}
        >
          <Icon name="search" size={20} color={colors.secondary} />
          <TextInput
            accessibilityLabel="Search exercises to add"
            placeholder="Search name, muscle, equipment"
            placeholderTextColor={colors.secondary}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            style={[s.text, { flex: 1, minHeight: 52 }]}
          />
        </View>
        {results.map((e) => {
          const on = selected.includes(e.id);
          const cover = coverFor(e, model);
          return (
            <Pressable
              key={e.id}
              accessibilityRole="button"
              accessibilityLabel={`${on ? "Remove" : "Add"} ${e.name}`}
              accessibilityState={{ selected: on }}
              onPress={() => toggle(e.id)}
              style={({ pressed }) => [
                s.row,
                {
                  padding: 6,
                  paddingRight: 14,
                  borderRadius: 20,
                  backgroundColor: pressed ? colors.surface2 : on ? colors.accentDim : colors.surface,
                },
              ]}
            >
              <Image
                source={content.resolve(cover.poster)}
                contentFit="contain"
                style={{ width: 44, height: 55, borderRadius: 12, backgroundColor: mediaBackground }}
              />
              <View style={{ flex: 1 }}>
                <Text style={s.headline}>{e.name}</Text>
                <Text numberOfLines={1} style={s.footnote}>
                  {equipmentSummary(e)}
                </Text>
              </View>
              <Icon
                name={on ? "checkmark-circle" : "add-circle-outline"}
                size={26}
                color={on ? colors.accentInk : colors.secondary}
              />
            </Pressable>
          );
        })}
      </ScrollView>
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: colors.bg,
        }}
      >
        <Button title={existing ? "Save changes" : "Save routine"} disabled={!valid} onPress={save} />
      </View>
    </Screen>
  );
}
