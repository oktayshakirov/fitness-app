import { useWidgetSync } from "../src/widget/sync";
import { startPro } from "../src/pro/pro";
import { useSettings } from "../src/storage/store";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "../src/components/Toast";
import { RestTimerHost } from "../src/components/RestTimer";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, DarkTheme, DefaultTheme } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect, useLayoutEffect } from "react";
import { Appearance, useColorScheme } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { colors, notifyScheme, setScheme, type Scheme } from "../src/theme";
import { useContentUpdates } from "../src/content/updates";
void SplashScreen.preventAutoHideAsync();
export const unstable_settings = { anchor: "(tabs)" };
export { RootError as ErrorBoundary } from "../src/components/ErrorScreen";

export default function RootLayout() {
  const settings = useSettings();
  // The phone's setting, unless the user picked light or dark in the app.
  const system = useColorScheme();
  const scheme: Scheme =
    settings.appearance === "system" ? (system === "light" ? "light" : "dark") : settings.appearance;
  // Swap the palette before this render so the tree below paints with it; screens that did not
  // re-render with it are told after commit.
  setScheme(scheme);
  useLayoutEffect(() => {
    notifyScheme();
    // Root view behind sheets, the keyboard and transitions: no flash of the other colour.
    void SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
  }, [scheme]);
  useEffect(() => {
    // Native parts (alerts, keyboard, switches, pickers) follow the in-app choice too.
    Appearance.setColorScheme(settings.appearance === "system" ? "unspecified" : settings.appearance);
  }, [settings.appearance]);
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
          ...(scheme === "dark" ? DarkTheme : DefaultTheme),
          colors: {
            ...(scheme === "dark" ? DarkTheme : DefaultTheme).colors,
            background: colors.bg,
            card: colors.bg,
            primary: colors.accentInk,
          },
        }}
      >
        <SafeAreaProvider>
          <ToastProvider>
            <StatusBar style={scheme === "dark" ? "light" : "dark"} />
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
