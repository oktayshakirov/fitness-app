import { useRef, useState } from "react";
import { router } from "expo-router";
import { Alert, ScrollView, View } from "react-native";
import { Text } from "../../src/components/Text";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import Constants from "expo-constants";
import { reloadAppAsync } from "expo";
import { Screen, Heading, Group, IconCircle, Row, Segmented, SectionTitle, s } from "../../src/components/ui";
import { ModelChoice } from "../../src/components/ModelChoice";
import { Avatar } from "../../src/components/Avatar";
import { content, label } from "../../src/content";
import { useStagedContent } from "../../src/content/updates";
import { dayKey } from "../../src/storage/calendar";
import {
  exportData,
  getEntries,
  importData,
  updateSettings,
  useEntries,
  useSettings,
} from "../../src/storage/store";
import type { Settings as Preferences } from "../../src/storage/preferences";
import { maxBackupBytes, parseBackup } from "../../src/storage/backup";
import { plural } from "../../src/storage/format";
import { colors, tabBarSpace } from "../../src/theme";
export default function Profile() {
  const settings = useSettings();
  const entries = useEntries();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [credits, setCredits] = useState(false);
  const staged = useStagedContent();
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
          dialogTitle: "Export fitness data",
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
        const confirmed = await new Promise<boolean>((resolve) =>
          Alert.alert(
            "Import backup?",
            `Adds ${plural(added, "new log")}${existing ? ` and skips ${existing} already on this device` : ""}. Also restores model, units and recovery speed from this backup.`,
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
          <View style={[s.row, { gap: 8 }]}>
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
        </Group>
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
          <Text selectable style={[s.footnote, { lineHeight: 20, marginTop: 8 }]}>
            {content.release.attribution}
          </Text>
        )}
        <Text style={[s.footnote, { textAlign: "center", marginTop: 16 }]}>
          Available offline · no account needed
        </Text>
      </ScrollView>
    </Screen>
  );
}
