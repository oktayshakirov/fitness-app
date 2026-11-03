import { router } from "expo-router";
import { ScrollView } from "react-native";
import { Text } from "../src/components/Text";
import { Screen, Heading, IconButton, Card, s } from "../src/components/ui";
export default function Privacy() {
  return (
    <Screen>
      <Heading
        title="Privacy"
        action={
          <IconButton
            name="close"
            label="Close privacy"
            onPress={() => router.back()}
          />
        }
      />
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}
      >
        <Card>
          <Text style={s.title}>Your training stays on your device</Text>
          <Text style={[s.secondary, { marginTop: 12 }]}>
            Your workout logs, notes and preferences are stored locally. No
            account is required.
          </Text>
        </Card>
        <Text style={s.text}>
          This build has no analytics, ads, purchases or automatic content
          downloads.
        </Text>
        <Text style={s.text}>
          Export creates a plain JSON backup containing your logs, notes and
          preferences. You choose whether and where to share it. Keep backups
          somewhere you trust.
        </Text>
        <Text style={s.text}>
          Import is processed on your device. Existing entries are kept when a
          backup contains the same log IDs.
        </Text>
        <Text style={s.text}>
          Your operating system may include app data in device backups according
          to your device settings. Uninstalling the app may remove local data;
          export first if you want to keep it.
        </Text>
        <Text style={s.footnote}>
          Applies to app version 0.1.0. Development builds also connect to the
          developer's local server.
        </Text>
      </ScrollView>
    </Screen>
  );
}
