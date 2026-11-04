import { useEffect } from "react";
import {
  Pressable,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/**
 * Motion rules: transforms and opacity on the UI thread (Reanimated), short
 * timings, nothing that loops, no entering/layout animations inside FlashList
 * cells. Reanimated skips animations when the OS Reduce Motion setting is on.
 */
export const motion = {
  press: 90,
  fast: 150,
  base: 220,
  slow: 600,
} as const;
/** Quick, barely-bouncy settle used for press release and sliding indicators. */
export const settle = { damping: 18, stiffness: 320, mass: 0.6 } as const;

/** Scale-on-press for a view other than the Pressable itself (e.g. a whole card). */
export function usePressScale(scaleTo = 0.97) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return {
    style,
    onPressIn: () => {
      if (!reduced) scale.value = withTiming(scaleTo, { duration: motion.press });
    },
    onPressOut: () => {
      scale.value = withSpring(1, settle);
    },
  };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable that shrinks slightly while held and springs back on release.
 * `style` must be static (no `({ pressed }) => …`): the scale is the feedback.
 */
export function PressableScale({
  scaleTo = 0.97,
  style,
  onPressIn,
  onPressOut,
  ...props
}: Omit<PressableProps, "style"> & { style?: StyleProp<ViewStyle>; scaleTo?: number }) {
  const press = usePressScale(scaleTo);
  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e: GestureResponderEvent) => {
        press.onPressIn();
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        press.onPressOut();
        onPressOut?.(e);
      }}
      style={[style, press.style]}
    />
  );
}

/** Rounded track whose fill eases to `value` (0–1) on mount and on every change. */
export function ProgressBar({
  value,
  fill,
  track,
  height = 8,
}: {
  value: number;
  fill: string;
  track: string;
  height?: number;
}) {
  const width = useSharedValue(0);
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(Math.max(0, Math.min(1, value)), {
      duration: motion.slow,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, value]);
  const style = useAnimatedStyle(() => ({ width: progress.value * width.value }));
  return (
    <View
      onLayout={(e) => {
        width.value = e.nativeEvent.layout.width;
      }}
      style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: "hidden" }}
    >
      <Animated.View style={[{ height, borderRadius: height / 2, backgroundColor: fill }, style]} />
    </View>
  );
}
