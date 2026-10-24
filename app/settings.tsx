import { router } from "expo-router";
import { ScrollView, Text } from "react-native";
import { Screen, Heading, IconButton, Card, s } from "../src/components/ui";
import { content } from "../src/content";
export default function Settings() {
  return (
    <Screen>
      <Heading
        title="Settings"
        action={
          <IconButton
            name="close"
            label="Close settings"
            onPress={() => router.back()}
          />
        }
      />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 24 }}>
        <Card>
          <Text style={s.text}>Content {content.release.contentVersion}</Text>
          <Text style={s.secondary}>
            30 approved exercises · available offline
          </Text>
          <Text style={s.footnote}>App 0.1.0</Text>
        </Card>
        <Text accessibilityRole="header" style={s.title}>
          Credits & licences
        </Text>
        <Text selectable style={[s.footnote, { lineHeight: 20 }]}>
          {content.release.attribution}
        </Text>
      </ScrollView>
    </Screen>
  );
}
