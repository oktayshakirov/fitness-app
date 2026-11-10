import { useWidgetSync } from "../src/widget/sync";
import { startPro } from "../src/pro/pro";
import { useSettings } from "../src/storage/store";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "../src/components/Toast";
import { RestTimerHost } from "../src/components/RestTimer";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, DarkTheme } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { colors } from "../src/theme";
import { useContentUpdates } from "../src/content/updates";
void SplashScreen.preventAutoHideAsync();
// Dark root view: no white flash behind sheets, the keyboard or screen transitions.
void SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
export const unstable_settings = { anchor: "(tabs)" };
export { RootError as ErrorBoundary } from "../src/components/ErrorScreen";

export default function RootLayout() {
  const settings = useSettings();
  useContentUpdates();
  useEffect(() => void startPro(), []);
  useWidgetSync();
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const ready = fontsLoaded || !!fontError;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);
  if (!ready) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider
        value={{
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: colors.bg,
            card: colors.bg,
            primary: colors.accent,
          },
        }}
      >
        <SafeAreaProvider>
          <ToastProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              <Stack.Protected guard={!settings.onboarded} redirectTo="/(tabs)">
                <Stack.Screen name="onboarding" />
              </Stack.Protected>
              <Stack.Protected
                guard={settings.onboarded}
                redirectTo="/onboarding"
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="exercise/[id]" />
                <Stack.Screen name="routine/[id]" />
                {/* No swipe-back: unsaved changes are only discarded through Close's prompt. */}
                <Stack.Screen name="routine/edit" options={{ gestureEnabled: false }} />
                <Stack.Screen
                  name="log"
                  options={{
                    presentation: "formSheet",
                    sheetAllowedDetents: [0.65, 1],
                    sheetGrabberVisible: true,
                  }}
                />
              </Stack.Protected>
              <Stack.Screen name="privacy" />
            </Stack>
            <RestTimerHost />
          </ToastProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
