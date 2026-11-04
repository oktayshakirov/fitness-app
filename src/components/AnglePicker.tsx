import { ScrollView, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Text } from "./Text";
import { content, mediaBackground, viewHints, viewLabels, viewOrder } from "../content";
import type { CameraView, ExerciseView } from "../content/types";
import { colors, type } from "../theme";
import { s } from "./ui";
import { PressableScale } from "./motion";

/**
 * Camera angle picker: each option shows that angle's own poster, so the
 * camera position is visible before switching. Scrolls past three angles.
 * Narrow screens and large text stack the label under the thumbnail so a
 * name like "Angled" is never broken mid-word.
 */
export function AnglePicker({
  media,
  value,
  onChange,
}: {
  media: Partial<Record<CameraView, ExerciseView>>;
  value: CameraView;
  onChange: (view: CameraView) => void;
}) {
  const { width, fontScale } = useWindowDimensions();
  const views = viewOrder.filter((v) => media[v]);
  if (views.length < 2) return null;
  const scrolls = views.length > 3;
  const stacked = fontScale > 1.15 || width < 350;
  const options = views.map((view) => {
    const selected = view === value;
    return (
      <PressableScale
        key={view}
        accessibilityRole="tab"
        accessibilityLabel={viewLabels[view]}
        accessibilityHint={viewHints[view]}
        accessibilityState={{ selected }}
        onPress={() => {
          if (selected) return;
          void Haptics.selectionAsync();
          onChange(view);
        }}
        scaleTo={0.95}
        style={[
          stacked ? { alignItems: "center", gap: 4, paddingHorizontal: 6 } : [s.row, { gap: 6, paddingRight: 8 }],
          {
            paddingVertical: 5,
            paddingLeft: stacked ? 6 : 5,
            minHeight: 58,
            borderRadius: 18,
            borderWidth: 1.5,
            borderColor: selected ? colors.accent : colors.surface,
            backgroundColor: selected ? colors.accentDim : colors.surface,
          },
          scrolls ? { width: 120 } : { flex: 1 },
        ]}
      >
        <Image
          source={content.resolve(media[view]!.poster)}
          contentFit="contain"
          cachePolicy="memory-disk"
          style={{
            width: 34,
            height: 42,
            borderRadius: 12,
            backgroundColor: mediaBackground,
            opacity: selected ? 1 : 0.75,
          }}
        />
        <Text
          numberOfLines={2}
          style={{
            ...type.footnote,
            fontWeight: "500",
            color: selected ? colors.text : colors.secondary,
            flexShrink: 1,
            textAlign: stacked ? "center" : "left",
          }}
        >
          {viewLabels[view]}
        </Text>
      </PressableScale>
    );
  });
  return scrolls ? (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      accessibilityLabel="Camera angle"
      contentContainerStyle={{ gap: 8 }}
    >
      {options}
    </ScrollView>
  ) : (
    <View accessibilityRole="tablist" accessibilityLabel="Camera angle" style={[s.row, { gap: 8 }]}>
      {options}
    </View>
  );
}
