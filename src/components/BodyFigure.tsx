import { useState } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from "react-native-reanimated";
import { content, muscleAt } from "../content";
import { muscleIds, type BodyView, type MediaAsset, type Muscle } from "../content/types";
import { colors } from "../theme";
function Mask({
  asset,
  tint,
  opacity,
}: {
  asset: MediaAsset;
  tint: string;
  opacity: number;
}) {
  const reduced = useReducedMotion();
  const style = useAnimatedStyle(() => ({
    opacity: withTiming(opacity, { duration: reduced ? 0 : 150 }),
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", inset: 0 }, style]}
    >
      <Image
        source={content.resolve(asset)}
        tintColor={tint}
        contentFit="contain"
        style={{ width: "100%", height: "100%" }}
      />
    </Animated.View>
  );
}
/** Base render plus one tinted alpha mask per coloured muscle; taps resolve through the hit regions. */
export function BodyFigure({
  view,
  tints,
  focused,
  onPressMuscle,
  style,
  accessibilityLabel,
}: {
  view: BodyView;
  tints: Partial<Record<Muscle, string>>;
  focused?: Muscle;
  onPressMuscle?: (muscle: Muscle) => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const figure = (
    <>
      <Image
        source={content.resolve(view.base)}
        contentFit="contain"
        style={{ width: "100%", height: "100%" }}
      />
      {muscleIds.map((m) => {
        const asset = view.masks[m];
        if (!asset) return null;
        // Focus keeps the muscle's own colour (white when it has none) so it never reads as "Ready".
        const tint = tints[m];
        const isFocused = m === focused;
        return (
          <Mask
            key={m}
            asset={asset}
            tint={tint ?? colors.text}
            opacity={isFocused ? (tint ? 1 : 0.55) : tint ? 0.7 : 0}
          />
        );
      })}
    </>
  );
  if (!onPressMuscle)
    return (
      <View accessible accessibilityLabel={accessibilityLabel} style={style}>
        {figure}
      </View>
    );
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Tap a muscle to select it"
      onLayout={(e) => setSize(e.nativeEvent.layout)}
      onPress={(e) => {
        // contentFit="contain": map the touch into the 800×1000 render frame.
        const scale = Math.min(size.width / 800, size.height / 1000);
        const x = (e.nativeEvent.locationX - (size.width - 800 * scale) / 2) / scale;
        const y = (e.nativeEvent.locationY - (size.height - 1000 * scale) / 2) / scale;
        const muscle = muscleAt(view, x, y);
        if (muscle) onPressMuscle(muscle);
      }}
      style={style}
    >
      {figure}
    </Pressable>
  );
}
