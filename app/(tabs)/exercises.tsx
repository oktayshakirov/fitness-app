import { useEffect, useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Screen, Heading, Chip, Empty, IconButton, s } from "../../src/components/ui";
import { Text, TextInput } from "../../src/components/Text";
import { useToast } from "../../src/components/Toast";
import {
  content,
  coverFor,
  equipmentFilters,
  equipmentSummary,
  filterCatalog,
  label,
  mediaBackground,
} from "../../src/content";
import { muscleIds, type Exercise } from "../../src/content/types";
import { deleteEntry, logExercise, useSettings } from "../../src/storage/store";
import { colors, tabBarSpace } from "../../src/theme";
export default function Library() {
  const { model } = useSettings();
  const { fontScale } = useWindowDimensions();
  const columns = fontScale > 1.15 ? 1 : 2;
  const toast = useToast();
  const params = useLocalSearchParams<{ muscle?: string }>();
  const [muscle, setMuscle] = useState(params.muscle ?? "");
  const [equipment, setEquipment] = useState("");
  const [query, setQuery] = useState("");
  const [showMuscles, setShowMuscles] = useState(false);
  useEffect(() => {
    setMuscle(params.muscle ?? "");
  }, [params.muscle]);
  const filtered = useMemo(
    () => filterCatalog({ muscle, equipment, query }),
    [muscle, equipment, query],
  );
  function chooseMuscle(m: string) {
    setMuscle(m);
    router.setParams({ muscle: m });
  }
  function open(exercise: Exercise) {
    router.push({
      pathname: "/exercise/[id]",
      params: { id: exercise.id, muscle, equipment, query },
    });
  }
  function quickLog(exercise: Exercise) {
    try {
      const entry = logExercise(exercise);
      toast({ text: `Logged ${exercise.name}`, undo: () => deleteEntry(entry.id) });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Could not log", "Please try again.");
    }
  }
  return (
    <Screen>
      <Heading
        eyebrow="Library"
        title={muscle ? label(muscle) : "Exercises"}
        subtitle={`${filtered.length} ${filtered.length === 1 ? "exercise" : "exercises"}`}
        action={
          <IconButton
            name={muscle || showMuscles ? "body" : "body-outline"}
            label="Filter by muscle"
            onPress={() => setShowMuscles(!showMuscles)}
          />
        }
      />
      <View style={styles.search}>
        <Ionicons name="search" size={20} color={colors.secondary} />
        <TextInput
          accessibilityLabel="Search exercises"
          placeholder="Search"
          placeholderTextColor={colors.secondary}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          submitBehavior="blurAndSubmit"
          returnKeyType="search"
          style={[s.text, { flex: 1, minHeight: 52 }]}
        />
        {!!query && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={12}
            onPress={() => setQuery("")}
          >
            <Ionicons name="close-circle" size={18} color={colors.secondary} />
          </Pressable>
        )}
      </View>
      {(showMuscles || !!muscle) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filters}
          contentContainerStyle={styles.chips}
        >
          {showMuscles ? (
            <>
              <Chip title="All muscles" selected={!muscle} onPress={() => chooseMuscle("")} />
              {muscleIds.map((m) => (
                <Chip
                  key={m}
                  title={label(m)}
                  selected={muscle === m}
                  onPress={() => chooseMuscle(m)}
                />
              ))}
            </>
          ) : (
            <Chip title={`${label(muscle)}  ✕`} selected onPress={() => chooseMuscle("")} />
          )}
        </ScrollView>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={styles.chips}
      >
        <Chip title="All" selected={!equipment} onPress={() => setEquipment("")} />
        {equipmentFilters.map((f) => (
          <Chip
            key={f.id}
            title={f.title}
            icon={f.icon && content.resolve(f.icon)}
            selected={f.id === equipment}
            onPress={() => setEquipment(f.id === equipment ? "" : f.id)}
          />
        ))}
      </ScrollView>
      <FlashList
        data={filtered}
        key={columns}
        numColumns={columns}
        keyExtractor={(e) => e.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: tabBarSpace }}
        ListEmptyComponent={
          <Empty
            icon="search"
            title="No exercises found"
            description="Try a different muscle, equipment or search."
          />
        }
        renderItem={({ item }) => {
          const cover = coverFor(item, model);
          return (
            <View style={styles.card}>
              <Pressable
                accessibilityRole="button"
                testID={`exercise-${item.id}`}
                accessibilityLabel={`${item.name}, ${equipmentSummary(item)}`}
                onPress={() => open(item)}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Image
                  source={content.resolve(cover.poster)}
                  recyclingKey={cover.poster.path}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  style={styles.poster}
                />
                <View style={{ paddingHorizontal: 8, paddingTop: 10, paddingBottom: 6, gap: 2 }}>
                  <Text
                    numberOfLines={columns === 1 ? undefined : 2}
                    style={s.headline}
                  >
                    {item.name}
                  </Text>
                  <Text numberOfLines={1} style={s.footnote}>
                    {equipmentSummary(item)}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Log ${item.name}`}
                hitSlop={6}
                onPress={() => quickLog(item)}
                style={({ pressed }) => [styles.add, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name="add" size={22} color={colors.onAccent} />
              </Pressable>
            </View>
          );
        }}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    paddingHorizontal: 18,
    backgroundColor: colors.surface,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  filters: { flexGrow: 0, marginTop: 12 },
  chips: { paddingHorizontal: 20, gap: 8 },
  card: {
    flex: 1,
    margin: 6,
    padding: 6,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  poster: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: 18,
    backgroundColor: mediaBackground,
  },
  add: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
});
