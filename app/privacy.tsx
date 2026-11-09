import { router } from "expo-router";
import { ScrollView } from "react-native";
import Constants from "expo-constants";
import { Text } from "../src/components/Text";
import { Screen, Heading, IconButton, Card, s } from "../src/components/ui";
import { contentUrl } from "../src/content/updates";
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
          This version has no analytics, ads or purchases.
        </Text>
        <Text style={s.text}>
          {contentUrl
            ? "To get new and corrected exercises, the app checks the exercise library server when it opens, at most every few hours. It downloads exercise text, videos and images only; your logs, notes and preferences are never sent. Like any web request, the server can see your IP address."
            : "Exercises are built into the app; this version does not download content."}
        </Text>
        <Text style={s.text}>
          If you allow notifications, your phone alerts you when a rest ends.
          The alert is scheduled on your device and nothing is sent to a server.
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
          Erase all logs in Profile deletes your logs and notes from this
          device, along with backup copies the app saved for sharing. Your
          settings stay. Undo is available for 10 seconds.
        </Text>
        <Text style={s.text}>
          Your operating system may include app data in device backups according
          to your device settings. Uninstalling the app may remove local data;
          export first if you want to keep it.
        </Text>
        <Text style={s.footnote}>
          Applies to app version {Constants.expoConfig?.version ?? "0.1.0"}.
          {__DEV__ ? " Development builds also connect to the developer's local server." : ""}
        </Text>
      </ScrollView>
    </Screen>
  );
}
