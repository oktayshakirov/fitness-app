import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { AccessibilityInfo, Alert, Pressable } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Text } from "./Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme";
import { s } from "./ui";
import { motion } from "./motion";
type Message = { text: string; undo: () => void };
/** How long Undo stays available. */
const visibleMs = 10000;
const Context = createContext<(message: Message) => void>(() => {});
/** Thin lime line that runs down while Undo is still available. Hidden with Reduce Motion. */
function Countdown() {
  const reduced = useReducedMotion();
  const left = useSharedValue(1);
  useEffect(() => {
    left.value = withTiming(0, { duration: visibleMs, easing: Easing.linear });
  }, [left]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: left.value }] }));
  if (reduced) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: 24,
          right: 24,
          bottom: 5,
          height: 2,
          borderRadius: 1,
          backgroundColor: colors.accent,
          opacity: 0.6,
          transformOrigin: "left",
        },
        style,
      ]}
    />
  );
}
export function ToastProvider({ children }: PropsWithChildren) {
  const [message, setMessage] = useState<(Message & { id: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const count = useRef(0);
  const insets = useSafeAreaInsets();
  useEffect(() => () => clearTimeout(timer.current), []);
  function show(next: Message) {
    clearTimeout(timer.current);
    // A new id re-runs the entrance and restarts the countdown.
    setMessage({ ...next, id: ++count.current });
    AccessibilityInfo.announceForAccessibility(
      `${next.text}. Undo is available.`,
    );
    timer.current = setTimeout(() => setMessage(null), visibleMs);
  }
  return (
    <Context.Provider value={show}>
      {children}
      {message && (
        <Animated.View
          key={message.id}
          entering={FadeInDown.duration(motion.base)}
          exiting={FadeOutDown.duration(motion.fast)}
          accessibilityLiveRegion="polite"
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: Math.max(insets.bottom, 12) + 82,
            backgroundColor: colors.surface3,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: colors.separator,
            paddingLeft: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={[s.text, { flex: 1 }]}>{message.text}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              try {
                message.undo();
                clearTimeout(timer.current);
                setMessage(null);
              } catch {
                Alert.alert(
                  "Could not undo",
                  "Your saved log is unchanged. Please try again.",
                );
              }
            }}
            style={{ minHeight: 48, padding: 16, flexShrink: 0 }}
          >
            <Text style={{ color: colors.accent, fontSize: 16, fontWeight: "600" }}>Undo</Text>
          </Pressable>
          <Countdown />
        </Animated.View>
      )}
    </Context.Provider>
  );
}
export const useToast = () => useContext(Context);
