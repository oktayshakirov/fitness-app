import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { AccessibilityInfo, Alert, Pressable, View } from "react-native";
import { Text } from "./Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme";
import { s } from "./ui";
type Message = { text: string; undo: () => void };
const Context = createContext<(message: Message) => void>(() => {});
export function ToastProvider({ children }: PropsWithChildren) {
  const [message, setMessage] = useState<Message | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const insets = useSafeAreaInsets();
  useEffect(() => () => clearTimeout(timer.current), []);
  function show(next: Message) {
    clearTimeout(timer.current);
    setMessage(next);
    AccessibilityInfo.announceForAccessibility(
      `${next.text}. Undo is available.`,
    );
    timer.current = setTimeout(() => setMessage(null), 10000);
  }
  return (
    <Context.Provider value={show}>
      {children}
      {message && (
        <View
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
        </View>
      )}
    </Context.Provider>
  );
}
export const useToast = () => useContext(Context);
