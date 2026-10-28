import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { AccessibilityInfo, Alert, Pressable, Text, View } from "react-native";
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
            bottom: insets.bottom + 70,
            backgroundColor: colors.surface2,
            borderRadius: 16,
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
            <Text style={{ color: colors.accent, fontSize: 17 }}>Undo</Text>
          </Pressable>
        </View>
      )}
    </Context.Provider>
  );
}
export const useToast = () => useContext(Context);
