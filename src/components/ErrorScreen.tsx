import { useEffect } from "react";
import { Alert, ScrollView, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { reloadAppAsync } from "expo";
import { router, type ErrorBoundaryProps } from "expo-router";
import { Text } from "./Text";
import { Button, IconCircle, Screen, s } from "./ui";
import { content, contentOrigin } from "../content";
import { rejectRunningRelease } from "../content/device";
import { tabBarSpace, useScheme } from "../theme";

/**
 * Shown instead of a screen that threw while rendering. A downloaded exercise
 * release is the likeliest cause after install, so it can be turned off here.
 */
function ErrorScreen({ error, retry, root }: ErrorBoundaryProps & { root: boolean }) {
  // A failure in the root layout happens before it could hide the splash.
  useEffect(() => {
    if (root) void SplashScreen.hideAsync().catch(() => {});
  }, [root]);
  const downloaded = contentOrigin === "remote";
  const version = content.release.contentVersion;
  function useBuiltIn() {
    try {
      rejectRunningRelease(version);
    } catch {
      Alert.alert("Could not switch", "Please restart the app and try again.");
      return;
    }
    void reloadAppAsync("Use built-in exercises");
  }
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, gap: 12, paddingBottom: tabBarSpace }}
      >
        <View style={{ alignItems: "center", gap: 12, marginBottom: 8 }}>
          <IconCircle name="alert" size={64} dim />
          <Text accessibilityRole="header" style={[s.title, { textAlign: "center" }]}>
            Something went wrong
          </Text>
          <Text style={[s.subhead, { textAlign: "center" }]}>
            This screen couldn't be shown. Your logs and settings are safe on this device.
          </Text>
        </View>
        <Button title="Try again" icon="refresh" onPress={() => void retry()} />
        {!root && router.canGoBack() && <Button secondary title="Close" onPress={() => router.back()} />}
        {downloaded && (
          <>
            <Button secondary icon="cube-outline" title="Use built-in exercises" onPress={useBuiltIn} />
            <Text style={[s.footnote, { textAlign: "center" }]}>
              Running exercise update {version}. Switching restarts the app and skips this update until a newer
              one is published.
            </Text>
          </>
        )}
        {root && (
          <Button secondary icon="reload" title="Restart app" onPress={() => void reloadAppAsync("Error screen")} />
        )}
        <Text selectable style={[s.caption, { textAlign: "center", marginTop: 12 }]}>
          {error.message}
        </Text>
      </ScrollView>
    </Screen>
  );
}
/** ErrorBoundary for the root layout: navigation is gone, so it offers a restart. */
export function RootError(props: ErrorBoundaryProps) {
  return <ErrorScreen {...props} root />;
}
/** ErrorBoundary for a single screen: tabs and the stack stay usable. */
export function ScreenError(props: ErrorBoundaryProps) {
  useScheme();
  return <ErrorScreen {...props} root={false} />;
}
