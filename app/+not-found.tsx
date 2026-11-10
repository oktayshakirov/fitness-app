import { useScheme } from "../src/theme";
import { router } from "expo-router";
import { View } from "react-native";
import { Button, Empty, Screen } from "../src/components/ui";

/** Unknown deep links (e.g. an old fitness://settings) land here instead of the router's debug page. */
export default function NotFound() {
  useScheme();
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 12 }}>
        <Empty icon="compass-outline" title="Page not found" description="This link doesn't open anything in Muscle Pal." />
        <Button title="Go to Home" arrow onPress={() => router.replace("/")} />
      </View>
    </Screen>
  );
}
