import { useEffect, useRef } from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import { Icon } from "./Icon";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "./Text";
import { Button, s } from "./ui";
import { PressableScale, motion } from "./motion";
import { clock, restLeft, restProgress, spokenDuration, type RestTimer } from "../workout/rest";
import { restTimer, useRestClock, useRestTimer } from "../workout/restTimer";
import { syncRestNotification } from "../workout/restNotification";
import { useSettings } from "../storage/store";
import { colors } from "../theme";

/** Lime line that runs down with the rest. Hidden with Reduce Motion. */
function RestLine({ timer }: { timer: RestTimer }) {
  const reduced = useReducedMotion();
  const left = useSharedValue(1);
  useEffect(() => {
    // Restarts from the true position whenever the timer starts or gets more time.
    const now = Date.now();
    left.value = restProgress(timer, now);
    left.value = withTiming(0, { duration: restLeft(timer, now), easing: Easing.linear });
  }, [left, timer]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: left.value }] }));
  if (reduced) return null;
  return <Animated.View pointerEvents="none" style={[styles.line, style]} />;
}

function PillAction({
  title,
  label,
  onPress,
  dark = false,
}: {
  title: string;
  label: string;
  onPress: () => void;
  dark?: boolean;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      scaleTo={0.92}
      style={[styles.action, dark && { backgroundColor: colors.onAccent }]}
    >
      <Text style={{ color: dark ? colors.accent : colors.text, fontSize: 14, fontWeight: "600" }}>{title}</Text>
    </PressableScale>
  );
}

/** The running countdown or the "Rest over" message. */
function RestPillView({
  timer,
  finishedAt,
  now,
  inline,
}: {
  timer: RestTimer | null;
  finishedAt: number | null;
  now: number;
  inline: boolean;
}) {
  const shell = [styles.pill, inline ? styles.inline : styles.floating];
  if (timer) {
    const left = restLeft(timer, now);
    return (
      <Animated.View key="running" entering={FadeIn.duration(motion.fast)} style={shell}>
        <View
          accessible
          accessibilityRole="timer"
          accessibilityLabel={`Rest timer, ${spokenDuration(left)} left`}
          style={[s.row, { gap: 8 }, inline && { flex: 1 }]}
        >
          <Icon name="timer-outline" size={18} color={colors.accent} />
          <Text style={styles.time}>{clock(left)}</Text>
          <Text style={s.footnote}>rest</Text>
        </View>
        <PillAction title="+15 s" label="Add 15 seconds" onPress={() => restTimer.extend(15)} />
        <PillAction title="Skip" label="Skip rest" onPress={() => restTimer.stop()} />
        <RestLine timer={timer} />
      </Animated.View>
    );
  }
  if (finishedAt)
    return (
      <Animated.View
        key="done"
        entering={FadeIn.duration(motion.fast)}
        style={[shell, { backgroundColor: colors.accent, borderColor: colors.accent }]}
      >
        <View accessible accessibilityLabel="Rest over" style={[s.row, { gap: 8 }, inline && { flex: 1 }]}>
          <Icon name="checkmark-circle" size={20} color={colors.onAccent} />
          <Text style={[styles.time, { color: colors.onAccent, fontSize: 17, minWidth: 0 }]}>Rest over</Text>
        </View>
        <PillAction dark title="OK" label="Dismiss" onPress={() => restTimer.dismiss()} />
      </Animated.View>
    );
  return null;
}

/** Inline countdown, for places the floating pill cannot reach (the Log sheet). */
export function RestPill() {
  const { timer, finishedAt } = useRestTimer();
  const now = useRestClock(timer);
  return <RestPillView timer={timer} finishedAt={finishedAt} now={now} inline />;
}

/** Log sheet control: a "Rest 1:30" button, or the countdown while resting. */
export function RestControl({ seconds }: { seconds: number }) {
  const { timer, finishedAt } = useRestTimer();
  if (timer || finishedAt) return <RestPill />;
  return (
    <Button
      secondary
      icon="timer-outline"
      title={`Rest ${clock(seconds * 1000)}`}
      onPress={() => {
        void Haptics.selectionAsync();
        restTimer.start(seconds);
      }}
    />
  );
}

/** Round button that starts (or restarts) the rest timer; its icon turns lime while resting. */
export function RestStartButton({ seconds }: { seconds: number }) {
  const { timer } = useRestTimer();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={timer ? "Restart rest timer" : "Start rest timer"}
      accessibilityHint={`Counts down ${spokenDuration(seconds * 1000)}`}
      onPress={() => {
        void Haptics.selectionAsync();
        restTimer.start(seconds);
      }}
      scaleTo={0.9}
      style={styles.start}
    >
      <Icon name="timer-outline" size={24} color={timer ? colors.accent : colors.text} />
    </PressableScale>
  );
}

/**
 * Mounted once at the root. Owns the countdown's side effects (3-2-1 ticks,
 * the end haptic and announcement, hiding "Rest over") and shows the floating
 * pill above the toast lane on every screen.
 */
export function RestTimerHost() {
  const { timer, finishedAt } = useRestTimer();
  const now = useRestClock(timer);
  const insets = useSafeAreaInsets();
  const ticked = useRef(0);
  const left = timer ? restLeft(timer, now) : 0;
  const { restAlerts } = useSettings();
  const endsAt = restAlerts ? (timer?.endsAt ?? null) : null;
  useEffect(() => syncRestNotification(endsAt), [endsAt]);
  useEffect(() => {
    if (!timer) return;
    if (left <= 0) {
      // Ended while the app was away: show the message, but no late buzz.
      const late = Date.now() - timer.endsAt > 2000;
      restTimer.finish();
      if (!late) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      AccessibilityInfo.announceForAccessibility("Rest over");
      return;
    }
    const second = Math.ceil(left / 1000);
    if (second > 3) ticked.current = 0;
    else if (second !== ticked.current) {
      ticked.current = second;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [timer, left]);
  useEffect(() => {
    if (!finishedAt) return;
    const id = setTimeout(() => restTimer.dismiss(), 5000);
    return () => clearTimeout(id);
  }, [finishedAt]);
  if (!timer && !finishedAt) return null;
  return (
    <Animated.View
      entering={FadeInDown.duration(motion.base)}
      exiting={FadeOutDown.duration(motion.fast)}
      pointerEvents="box-none"
      // The toast lane is 82 pt above the bottom inset and about 56 pt tall.
      style={[styles.lane, { bottom: Math.max(insets.bottom, 12) + 146 }]}
    >
      <RestPillView timer={timer} finishedAt={finishedAt} now={now} inline={false} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  lane: { position: "absolute", left: 20, right: 20, alignItems: "center" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 52,
    paddingLeft: 16,
    paddingRight: 6,
    borderRadius: 26,
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  floating: { alignSelf: "center" },
  inline: { alignSelf: "stretch", backgroundColor: colors.surface },
  // A fixed width keeps the pill from shifting as digits change.
  time: { color: colors.text, fontSize: 20, fontWeight: "600", lineHeight: 26, minWidth: 58 },
  action: {
    minHeight: 40,
    minWidth: 44,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
  },
  line: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 4,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.accent,
    opacity: 0.6,
    transformOrigin: "left",
  },
  start: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
  },
});
