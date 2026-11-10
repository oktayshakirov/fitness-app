import { type ComponentRef, useEffect, useMemo, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Icon } from "../../src/components/Icon";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { PressableScale, motion, settle, usePressScale } from "../../src/components/motion";
import { Screen, Heading, Chip, Empty, PillButton, s } from "../../src/components/ui";
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
import { muscleIds, type Exercise, type Model, type Muscle } from "../../src/content/types";
import { MuscleIcon } from "../../src/components/MuscleIcon";
import { deleteEntry, logExercise, useEntries, useSettings } from "../../src/storage/store";
import { dayKey } from "../../src/storage/calendar";
import { colors, contentWidth, tabBarSpace, themed, useScheme } from "../../src/theme";
export { ScreenError as ErrorBoundary } from "../../src/components/ErrorScreen";
/** Quick-log "+": shrinks while held; after a log the icon pops into a check for a moment. */
function QuickLogButton({ name, onLog }: { name: string; onLog: () => boolean }) {
  const [justLogged, setJustLogged] = useState(false);
  const reduced = useReducedMotion();
  const pop = useSharedValue(1);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const icon = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Log ${name}`}
      hitSlop={6}
      scaleTo={0.85}
      onPress={() => {
        if (!onLog()) return;
        setJustLogged(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setJustLogged(false), 1200);
        if (!reduced) pop.value = withSequence(withTiming(1.3, { duration: 110 }), withSpring(1, settle));
      }}
      style={styles.add}
    >
      <Animated.View style={icon}>
        <Icon name={justLogged ? "checkmark" : "add"} size={22} color={colors.onAccent} />
      </Animated.View>
    </PressableScale>
  );
}
/** Grid card. The whole card scales while its poster area is pressed; the + is a separate button. */
function ExerciseCard({
  item,
  model,
  columns,
  done,
  favorite,
  onOpen,
  onLog,
}: {
  item: Exercise;
  model: Model;
  columns: number;
  done: boolean;
  favorite: boolean;
  onOpen: () => void;
  onLog: () => boolean;
}) {
  const press = usePressScale(0.97);
  const cover = coverFor(item, model);
  return (
    <Animated.View style={[styles.card, press.style]}>
      <Pressable
        accessibilityRole="button"
        testID={`exercise-${item.id}`}
        accessibilityLabel={`${item.name}, ${equipmentSummary(item)}${favorite ? ", favorite" : ""}${done ? ", logged today" : ""}`}
        onPress={onOpen}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
      >
        <Image
          source={content.resolve(cover.poster)}
          recyclingKey={cover.poster.path}
          contentFit="contain"
          cachePolicy="memory-disk"
          style={styles.poster}
        />
        {done && (
          <View style={styles.today}>
            <Icon name="checkmark" size={13} color={colors.accent} />
            {/* Always light: the badge is a dark chip on the white poster in both themes. */}
            <Text style={[s.caption, { color: "#FFFFFF" }]}>Today</Text>
          </View>
        )}
        <View style={{ paddingHorizontal: 8, paddingTop: 10, paddingBottom: 6, gap: 2 }}>
          <Text numberOfLines={columns === 1 ? undefined : 2} style={s.headline}>
            {item.name}
          </Text>
          <View style={[s.row, { gap: 4 }]}>
            {favorite && <Icon name="star" size={12} color={colors.accentInk} />}
            <Text numberOfLines={1} style={[s.footnote, { flexShrink: 1 }]}>
              {equipmentSummary(item)}
            </Text>
          </View>
        </View>
      </Pressable>
      {/* Keyed so a recycled cell never shows another exercise's check. */}
      <QuickLogButton key={item.id} name={item.name} onLog={onLog} />
    </Animated.View>
  );
}
export default function Library() {
  const scheme = useScheme();
  const { model, favorites } = useSettings();
  const { fontScale, width } = useWindowDimensions();
  // The grid, search and strips share the centred column; an iPad-wide column fits a third card.
  const listWidth = Math.min(width, contentWidth);
  const gutter = (width - listWidth) / 2;
  const columns = (fontScale > 1.15 ? 1 : 2) + (listWidth >= 600 ? 1 : 0);
  const toast = useToast();
  // `at` is a fresh token on links from other screens (Home, an exercise's muscle chips).
  const params = useLocalSearchParams<{ muscle?: string; at?: string }>();
  const [muscle, setMuscle] = useState(params.muscle ?? "");
  const [equipment, setEquipment] = useState("");
  const [query, setQuery] = useState("");
  const muscleStrip = useRef<ComponentRef<typeof ScrollView>>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const entries = useEntries();
  // Exercises already logged today get a badge, handy mid-workout.
  const today = dayKey(Date.now());
  const doneToday = useMemo(
    () => new Set(entries.filter((e) => dayKey(e.timestamp) === today).map((e) => e.exerciseId)),
    [entries, today],
  );
  // A link from Home or an exercise can pick a muscle far along the strip: bring it into view.
  useEffect(() => {
    const index = muscleIds.indexOf(muscle as Muscle) + 1; // 0 is the All tile
    const step = TILE_WIDTH + TILE_GAP;
    const end = STRIP_PADDING * 2 + step * (muscleIds.length + 1) - TILE_GAP - listWidth;
    const centred = STRIP_PADDING + step * index - (listWidth - TILE_WIDTH) / 2;
    muscleStrip.current?.scrollTo({ x: Math.max(0, Math.min(end, centred)), animated: true });
  }, [muscle, listWidth]);
  const filtering = !!(muscle || equipment || query || favoritesOnly);
  function clearFilters() {
    setQuery("");
    setEquipment("");
    setFavoritesOnly(false);
    chooseMuscle("");
  }
  const lastLink = useRef(params.at);
  useEffect(() => {
    setMuscle(params.muscle ?? "");
    // A link from elsewhere shows that muscle's whole list, not one narrowed by an
    // earlier search or chip. Choosing a muscle here keeps the other filters.
    if (params.at && params.at !== lastLink.current) {
      lastLink.current = params.at;
      setQuery("");
      setEquipment("");
      setFavoritesOnly(false);
    }
  }, [params.muscle, params.at]);
  const filtered = useMemo(
    () => filterCatalog({ muscle, equipment, query }).filter((e) => !favoritesOnly || favoriteSet.has(e.id)),
    [muscle, equipment, query, favoritesOnly, favoriteSet],
  );
  // FlashList re-renders cells only when this changes.
  const cellState = useMemo(() => ({ doneToday, favoriteSet, scheme }), [doneToday, favoriteSet, scheme]);
  function chooseMuscle(m: string) {
    setMuscle(m);
    router.setParams({ muscle: m });
  }
  function open(exercise: Exercise) {
    router.push({
      pathname: "/exercise/[id]",
      params: { id: exercise.id, muscle, equipment, query, favorites: favoritesOnly ? "1" : "" },
    });
  }
  function quickLog(exercise: Exercise) {
    try {
      const entry = logExercise(exercise);
      // The toast and its Undo sit where the keyboard is while searching.
      Keyboard.dismiss();
      toast({ text: `Logged ${exercise.name}`, undo: () => deleteEntry(entry.id) });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch {
      Alert.alert("Could not log", "Please try again.");
      return false;
    }
  }
  return (
    <Screen>
      <Heading
        eyebrow="Library"
        title={muscle ? label(muscle) : "Exercises"}
        subtitle={`${filtered.length} ${filtered.length === 1 ? "exercise" : "exercises"}`}
        action={filtering ? <PillButton title="Clear" label="Clear filters" onPress={clearFilters} /> : undefined}
      />
      <View style={s.column}>
        <View style={styles.search}>
          <Icon name="search" size={20} color={colors.secondary} />
          <TextInput
            accessibilityLabel="Search exercises"
            placeholder="Search name, muscle, equipment"
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
              <Icon name="close-circle" size={18} color={colors.secondary} />
            </Pressable>
          )}
        </View>
        <ScrollView
          ref={muscleStrip}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.filters}
          contentContainerStyle={styles.chips}
        >
          <MuscleTile selected={!muscle} onPress={() => chooseMuscle("")} />
          {muscleIds.map((m) => (
            <MuscleTile key={m} muscle={m} selected={muscle === m} onPress={() => chooseMuscle(m)} />
          ))}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filters}
          contentContainerStyle={styles.chips}
        >
          {(favorites.length > 0 || favoritesOnly) && (
            <Chip
              title="Favorites"
              ionicon="star"
              selected={favoritesOnly}
              onPress={() => setFavoritesOnly(!favoritesOnly)}
            />
          )}
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
      </View>
      <FlashList
        data={filtered}
        key={columns}
        numColumns={columns}
        keyExtractor={(e) => e.id}
        extraData={cellState}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: 14 + gutter, paddingTop: 12, paddingBottom: tabBarSpace }}
        ListEmptyComponent={
          <Empty
            icon={favoritesOnly && !favorites.length ? "star-outline" : "search"}
            title={favoritesOnly && !favorites.length ? "No favorites yet" : "No exercises found"}
            description={
              favoritesOnly && !favorites.length
                ? "Tap the star on an exercise to keep it here."
                : "Try a different muscle, equipment or search."
            }
            action={filtering ? { title: "Clear filters", onPress: clearFilters } : undefined}
          />
        }
        renderItem={({ item }) => (
          <ExerciseCard
            item={item}
            model={model}
            columns={columns}
            done={doneToday.has(item.id)}
            favorite={favoriteSet.has(item.id)}
            onOpen={() => open(item)}
            onLog={() => quickLog(item)}
          />
        )}
      />
    </Screen>
  );
}
const TILE_WIDTH = 92;
const TILE_ICON = 60;
const TILE_GAP = 8;
const STRIP_PADDING = 20;
/** A muscle in the filter strip: big enough to tell the body parts apart at a glance. */
function MuscleTile({ muscle, selected, onPress }: { muscle?: Muscle; selected: boolean; onPress: () => void }) {
  const name = muscle ? label(muscle) : "All muscles";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ selected }}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.tile,
        pressed && { backgroundColor: colors.surface2 },
        selected && { borderColor: colors.accentInk, backgroundColor: colors.accentDim },
      ]}
    >
      {muscle ? (
        <MuscleIcon muscle={muscle} size={TILE_ICON} />
      ) : (
        <View style={{ width: TILE_ICON, height: TILE_ICON, alignItems: "center", justifyContent: "center" }}>
          <Icon name="body" size={48} color={colors.accentInk} />
        </View>
      )}
      <Text numberOfLines={1} style={[s.caption, { color: selected ? colors.accentInk : colors.text }]}>
        {name}
      </Text>
    </Pressable>
  );
}
const styles = themed(() => ({
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
  chips: { paddingHorizontal: STRIP_PADDING, gap: TILE_GAP },
  tile: {
    width: TILE_WIDTH,
    minHeight: 104,
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 6,
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "transparent",
    backgroundColor: colors.surface,
  },
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
  today: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(11,11,12,0.82)",
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
}));
