import { useRef, useState } from "react";
import { router } from "expo-router";
import { Alert, Linking, ScrollView, Switch, View } from "react-native";
import { Text } from "../../src/components/Text";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { Directory, File, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";
import Constants from "expo-constants";
import Animated, { FadeIn } from "react-native-reanimated";
import { motion } from "../../src/components/motion";
import { reloadAppAsync } from "expo";
import { Screen, Heading, Group, IconCircle, Row, Segmented, SectionTitle, s } from "../../src/components/ui";
import { ModelChoice } from "../../src/components/ModelChoice";
import { Avatar } from "../../src/components/Avatar";
import { useToast } from "../../src/components/Toast";
import { content, label } from "../../src/content";
import { useStagedContent } from "../../src/content/updates";
import { dayKey } from "../../src/storage/calendar";
import {
  eraseAllEntries,
  exportData,
  getEntries,
  getRoutines,
  importData,
  restoreEntries,
  updateSettings,
  useEntries,
  useSettings,
} from "../../src/storage/store";
import { goalChoices, restChoices, type Settings as Preferences } from "../../src/storage/preferences";
import { clock } from "../../src/workout/rest";
import { askForRestAlerts, useExactRestAlerts } from "../../src/workout/restNotification";
import { ContactSection } from "../../src/components/ContactSection";
import { ProSection } from "../../src/components/ProSection";
import { maxBackupBytes, parseBackup } from "../../src/storage/backup";
import { plural } from "../../src/storage/format";
import { colors, tabBarSpace } from "../../src/theme";
export { ScreenError as ErrorBoundary } from "../../src/components/ErrorScreen";
/** Removes backup copies that Export wrote to this app's cache. */
function clearExportedBackups() {
  try {
    for (const item of new Directory(Paths.cache).list())
      if (item instanceof File && /^fitness-backup-\d+\.json$/.test(item.name)) item.delete();
  } catch {
    // Best effort: the system clears the cache over time too.
  }
}
export default function Profile() {
  const settings = useSettings();
  const entries = useEntries();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [credits, setCredits] = useState(false);
  const exactAlerts = useExactRestAlerts();
  /** The system prompt only appears here, after the user asks for alerts. */
  async function toggleRestAlerts(on: boolean) {
    if (!on) {
      save({ restAlerts: false });
      return;
    }
    const result = await askForRestAlerts();
    if (result === "allowed") save({ restAlerts: true });
    else if (result === "blocked")
      Alert.alert("Notifications are off", "Turn on notifications for Muscle Pal in your phone's settings.", [
        { text: "Cancel", style: "cancel" },
        { text: "Open settings", onPress: () => void Linking.openSettings() },
      ]);
  }
  const staged = useStagedContent();
  const toast = useToast();
  function save(patch: Partial<Preferences>) {
    try {
      updateSettings(patch);
    } catch {
      Alert.alert("Could not save preferences", "Please try again.");
    }
  }
  async function transfer(kind: "export" | "import") {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      if (kind === "export") {
        if (!(await Sharing.isAvailableAsync()))
          throw new Error("Sharing isn't available on this device.");
        const file = new File(Paths.cache, `fitness-backup-${Date.now()}.json`);
        await file.write(exportData());
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/json",
          UTI: "public.json",
          dialogTitle: "Export Muscle Pal data",
        });
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["application/json", "text/plain"],
          copyToCacheDirectory: true,
        });
        if (result.canceled) return;
        const file = new File(result.assets[0]!.uri);
        if (file.size > maxBackupBytes)
          throw new Error("Choose a backup smaller than 25 MB.");
        const text = await file.text();
        const backup = parseBackup(text);
        const known = new Set(getEntries().map((e) => e.id));
        const added = backup.entries.filter((e) => !known.has(e.id)).length;
        const existing = backup.entries.length - added;
        const knownRoutines = new Set(getRoutines().map((r) => r.id));
        const newRoutines = backup.routines.filter((r) => !knownRoutines.has(r.id)).length;
        const confirmed = await new Promise<boolean>((resolve) =>
          Alert.alert(
            "Import backup?",
            `Adds ${plural(added, "new log")}${existing ? ` and skips ${existing} already on this device` : ""}${newRoutines ? `, plus ${plural(newRoutines, "routine")}` : ""}. Also restores your settings from this backup.`,
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "Import", onPress: () => resolve(true) },
            ],
            { cancelable: true, onDismiss: () => resolve(false) },
          ),
        );
        if (!confirmed) return;
        const imported = importData(text);
        Alert.alert(
          "Import complete",
          `Added ${plural(imported.added, "log")}. Kept ${plural(imported.skipped, "existing entry", "existing entries")}.`,
        );
      }
    } catch (error) {
      Alert.alert(
        kind === "export" ? "Could not export" : "Could not import",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  /** Deletes every log after a confirmation; settings and onboarding stay, and Undo restores them. */
  function erase() {
    const count = entries.length;
    Alert.alert(
      "Erase all logs?",
      `This deletes ${count === 1 ? "your log" : `all ${count} logs`} and their notes from this device. Your routines, favorites and settings stay. Export first if you want a copy.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Export first", onPress: () => void transfer("export") },
        {
          text: "Erase",
          style: "destructive",
          onPress: () => {
            try {
              const removed = eraseAllEntries();
              clearExportedBackups();
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              toast({ text: `Erased ${plural(removed.length, "log")}`, undo: () => restoreEntries(removed) });
            } catch {
              Alert.alert("Could not erase", "Your logs are unchanged. Please try again.");
            }
          },
        },
      ],
      { cancelable: true },
    );
  }
  return (
    <Screen>
      <Heading eyebrow="You" title="Profile" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 0, gap: 12, paddingBottom: tabBarSpace }}>
        <View style={[s.card, { gap: 18 }]}>
          <View style={[s.row, { gap: 14 }]}>
            <Avatar model={settings.model} size={64} />
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Your training</Text>
              <Text style={s.footnote}>
                {label(settings.model)} model · {settings.units} · {label(settings.recoverySpeed)} recovery
              </Text>
            </View>
          </View>
          <View style={[s.row, { gap: 8, alignItems: "stretch" }]}>
            {(
              [
                [entries.length, entries.length === 1 ? "Log" : "Logs"],
                [new Set(entries.map((e) => dayKey(e.timestamp))).size, "Active days"],
                [new Set(entries.map((e) => e.exerciseId)).size, "Exercises"],
              ] as const
            ).map(([value, title]) => (
              <View key={title} style={{ flex: 1, padding: 12, borderRadius: 18, backgroundColor: colors.surface2 }}>
                <Text style={[s.large, { fontSize: 24, lineHeight: 30 }]}>{value}</Text>
                <Text style={s.footnote}>{title}</Text>
              </View>
            ))}
          </View>
        </View>
        <ProSection />
        <SectionTitle title="Model" />
        <ModelChoice compact value={settings.model} onChange={(model) => save({ model })} />
        <Text style={[s.footnote, { marginHorizontal: 4 }]}>
          Changes the exercise videos and your body map.
        </Text>
        <SectionTitle title="Training" />
        <Group>
          <Row title="Weight units" icon="barbell-outline">
            <View style={{ width: 130 }}>
              <Segmented
                label="Weight units"
                value={settings.units}
                onChange={(units) => save({ units })}
                options={[
                  { value: "kg", title: "kg" },
                  { value: "lb", title: "lb" },
                ]}
              />
            </View>
          </Row>
          <View style={{ padding: 16, gap: 12 }}>
            <View style={s.row}>
              <IconCircle name="speedometer-outline" size={36} dim />
              <Text style={s.headline}>Recovery speed</Text>
            </View>
            <Segmented
              label="Recovery speed"
              value={settings.recoverySpeed}
              onChange={(recoverySpeed) => save({ recoverySpeed })}
              options={[
                { value: "slow", title: "Slow" },
                { value: "normal", title: "Normal" },
                { value: "fast", title: "Fast" },
              ]}
            />
            <Text style={s.footnote}>
              Scales the estimated recovery time. Your saved logs stay the same.
            </Text>
          </View>
          <View style={{ padding: 16, gap: 12 }}>
            <View style={s.row}>
              <IconCircle name="timer-outline" size={36} dim />
              <Text style={s.headline}>Rest timer</Text>
            </View>
            <Segmented
              label="Rest timer"
              value={String(settings.restSeconds)}
              onChange={(value) => save({ restSeconds: Number(value) })}
              options={restChoices.map((seconds) => ({ value: String(seconds), title: clock(seconds * 1000) }))}
            />
            <Text style={s.footnote}>
              Start it with the timer button on an exercise, or between sets in the log sheet.
            </Text>
          </View>
          <Row
            title="Rest alerts"
            detail="Notify me when a rest ends while the app is closed"
            icon="notifications-outline"
          >
            <Switch
              accessibilityLabel="Rest alerts"
              value={settings.restAlerts}
              onValueChange={(on) => void toggleRestAlerts(on)}
              trackColor={{ true: colors.accent, false: colors.surface3 }}
              thumbColor={colors.text}
              ios_backgroundColor={colors.surface3}
            />
          </Row>
          {settings.restAlerts && !exactAlerts.allowed && (
            <Row
              title="On-time rest alerts"
              detail="Android can delay alerts by up to a minute until you allow this"
              icon="alarm-outline"
              value="Allow"
              onPress={exactAlerts.allow}
            />
          )}
          <View style={{ padding: 16, gap: 12 }}>
            <View style={s.row}>
              <IconCircle name="flag-outline" size={36} dim />
              <Text style={s.headline}>Weekly goal</Text>
            </View>
            <Segmented
              label="Weekly goal, training days"
              value={String(settings.weeklyGoal)}
              onChange={(value) => save({ weeklyGoal: Number(value) })}
              // "3 days" does not fit five segments on a 360–410 pt phone; the caption says days.
              options={goalChoices.map((days) => ({
                value: String(days),
                title: String(days),
                accessibilityLabel: `${days} days`,
              }))}
            />
            <Text style={s.footnote}>Training days per week. Home shows this week against your goal.</Text>
          </View>
        </Group>
        <SectionTitle title="Your data" />
        <Group>
          <Row
            title={busy ? "Please wait…" : "Export data"}
            detail={`${plural(entries.length, "log")} on this device`}
            icon="share-outline"
            onPress={() => !busy && void transfer("export")}
          />
          <Row
            title="Import data"
            icon="download-outline"
            onPress={() => !busy && void transfer("import")}
          />
          <Row
            title="Erase all logs"
            detail={entries.length ? "Keeps your settings · Undo for 10 seconds" : "No logs on this device"}
            icon="trash-outline"
            destructive
            chevron={false}
            onPress={entries.length && !busy ? erase : undefined}
          />
        </Group>
        <ContactSection />
        <SectionTitle title="About" />
        <Group>
          <Row
            title="Privacy"
            icon="lock-closed"
            onPress={() => router.push("/privacy")}
          />
          <Row
            title="Credits & licences"
            icon="document-text-outline"
            onPress={() => setCredits(!credits)}
            chevron={false}
            value={credits ? "Hide" : "Show"}
          />
          <Row
            title="Content"
            value={`${content.release.contentVersion} · ${content.release.exercises.length} exercises`}
            icon="cube-outline"
          />
          {staged && (
            <Row
              title="Exercise update ready"
              detail={staged.version ? `${staged.version} · applies on restart` : "Restores the built-in library"}
              icon="refresh"
              value="Restart"
              onPress={() => void reloadAppAsync("Content update")}
            />
          )}
          <Row
            title="App version"
            value={Constants.expoConfig?.version ?? "0.1.0"}
            icon="information-circle-outline"
          />
        </Group>
        {credits && (
          <Animated.View entering={FadeIn.duration(motion.base)}>
            <Text selectable style={[s.footnote, { lineHeight: 20, marginTop: 8 }]}>
              {content.release.attribution}
            </Text>
          </Animated.View>
        )}
        <Text style={[s.footnote, { textAlign: "center", marginTop: 16 }]}>
          Available offline · no account needed
        </Text>
      </ScrollView>
    </Screen>
  );
}
