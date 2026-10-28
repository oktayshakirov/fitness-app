import { useSettings } from "../../src/storage/store";
import * as Haptics from "expo-haptics";
import { logExercise, deleteEntry } from "../../src/storage/store";
import { useToast } from "../../src/components/Toast";
import { useMemo, useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  Alert,
  useWindowDimensions,
  ScrollView,
  Text,
  TextInput,
  View,
  Pressable,
  StyleSheet,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import {
  Screen,
  Heading,
  Chip,
  Empty,
  IconButton,
  s,
} from "../../src/components/ui";
import { colors } from "../../src/theme";
import {
  content,
  exercises,
  label,
  mediaFor,
  mediaBackground,
} from "../../src/content";
import { muscleIds, type Exercise } from "../../src/content/types";
import { filterExercises } from "../../src/content/query";
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
    () => filterExercises(exercises, { muscle, equipment, query }),
    [muscle, equipment, query],
  );
  const equipmentTypes = useMemo(
    () => [...new Set(exercises.flatMap((e) => e.equipment))].sort(),
    [],
  );
  function open(exercise: Exercise) {
    router.push({
      pathname: "/exercise/[id]",
      params: { id: exercise.id, muscle, equipment, query },
    });
  }
  return (
    <Screen>
      <Heading
        title={muscle ? label(muscle) : "All exercises"}
        action={
          <IconButton
            name="options-outline"
            label="Filter by muscle"
            onPress={() => setShowMuscles(!showMuscles)}
          />
        }
      />
      <View style={styles.search}>
        <Ionicons name="search" size={20} color={colors.secondary} />
        <TextInput
          accessibilityLabel="Search exercises"
          placeholder="Search exercises"
          placeholderTextColor={colors.secondary}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          submitBehavior="blurAndSubmit"
          returnKeyType="search"
          style={[s.text, { flex: 1, minHeight: 44 }]}
        />
        {query ? (
          <IconButton
            name="close"
            label="Clear search"
            onPress={() => setQuery("")}
          />
        ) : null}
      </View>
      {showMuscles && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filters}
          contentContainerStyle={styles.chips}
        >
          <Chip
            title="All muscles"
            selected={!muscle}
            onPress={() => {
              setMuscle("");
              router.setParams({ muscle: "" });
            }}
          />
          {muscleIds.map((m) => (
            <Chip
              key={m}
              title={label(m)}
              selected={muscle === m}
              onPress={() => {
                setMuscle(m);
                router.setParams({ muscle: m });
              }}
            />
          ))}
        </ScrollView>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={styles.chips}
      >
        <Chip
          title="All equipment"
          selected={!equipment}
          onPress={() => setEquipment("")}
        />
        {equipmentTypes.map((e) => (
          <Chip
            key={e}
            title={label(e)}
            selected={e === equipment}
            onPress={() => setEquipment(e === equipment ? "" : e)}
          />
        ))}
      </ScrollView>
      <View
        style={[
          s.row,
          { flexWrap: "wrap", marginHorizontal: 20, marginVertical: 12 },
        ]}
      >
        <Text accessibilityLiveRegion="polite" style={s.footnote}>
          {filtered.length} {filtered.length === 1 ? "exercise" : "exercises"}
        </Text>
        {muscle || equipment || query ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMuscle("");
              setEquipment("");
              setQuery("");
              router.setParams({ muscle: "" });
            }}
            style={{
              marginLeft: "auto",
              minHeight: 44,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.accent }}>Clear filters</Text>
          </Pressable>
        ) : null}
      </View>
      <FlashList
        data={filtered}
        key={columns}
        numColumns={columns}
        keyExtractor={(e) => e.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 20 }}
        ListEmptyComponent={
          <Empty
            title="No exercises found"
            description="Try a different muscle, equipment or search."
          />
        }
        renderItem={({ item }) => {
          const media = mediaFor(item, model).views;
          const first = media.threeq ?? media.side ?? Object.values(media)[0]!;
          return (
            <View style={styles.card}>
              <Pressable
                accessibilityRole="button"
                testID={`exercise-${item.id}`}
                accessibilityLabel={`${item.name}, ${item.equipment.map(label).join(", ")}`}
                onPress={() => open(item)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <Image
                  source={content.resolve(first.poster)}
                  recyclingKey={first.poster.path}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  style={styles.poster}
                />
                <View style={{ padding: 12, gap: 6 }}>
                  <Text
                    numberOfLines={columns === 1 ? undefined : 2}
                    style={[s.text, { fontWeight: "600", minHeight: 44 }]}
                  >
                    {item.name}
                  </Text>
                  <Text style={s.footnote}>
                    {item.equipment.map(label).join(" · ")}
                  </Text>
                </View>
              </Pressable>
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: colors.surface,
                  borderRadius: 24,
                }}
              >
                <IconButton
                  name="add"
                  label={`Log ${item.name}`}
                  onPress={() => {
                    try {
                      const entry = logExercise(item);
                      toast({
                        text: "Logged",
                        undo: () => deleteEntry(entry.id),
                      });
                      void Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success,
                      );
                    } catch {
                      Alert.alert("Could not log", "Please try again.");
                    }
                  }}
                />
              </View>
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
    paddingLeft: 14,
    paddingRight: 4,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  filters: { flexGrow: 0, marginTop: 12 },
  chips: { paddingHorizontal: 20, gap: 8 },
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  poster: {
    width: "100%",
    aspectRatio: 4 / 5,
    backgroundColor: mediaBackground,
  },
});
