import { useSettings } from "../src/storage/store";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "../src/components/Toast";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, DarkTheme } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { colors } from "../src/theme";
export const unstable_settings = { initialRouteName: "(tabs)" };

export default function RootLayout() {
  const settings = useSettings();
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
                <Stack.Screen name="settings" />
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
          </ToastProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
