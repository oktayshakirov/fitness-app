import { useRef, useState } from "react";
import { router } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import Constants from "expo-constants";
import {
  Screen,
  Heading,
  IconButton,
  Card,
  Chip,
  Button,
  s,
} from "../src/components/ui";
import { ModelChoice } from "../src/components/ModelChoice";
import { content } from "../src/content";
import {
  exportData,
  getEntries,
  importData,
  updateSettings,
  useSettings,
} from "../src/storage/store";
import type { Settings as Preferences } from "../src/storage/preferences";
import { maxBackupBytes, parseBackup } from "../src/storage/backup";
export default function Settings() {
  const settings = useSettings();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
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
        const confirmed = await new Promise<boolean>((resolve) =>
          Alert.alert(
            "Import backup?",
            `Add ${added} logs and keep ${backup.entries.length - added} existing entries. Restore model, units and recovery speed from this backup.`,
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => resolve(false),
              },
              { text: "Import", onPress: () => resolve(true) },
            ],
            { cancelable: true, onDismiss: () => resolve(false) },
          ),
        );
        if (!confirmed) return;
        const imported = importData(text);
        Alert.alert(
          "Import complete",
          `Added ${imported.added} logs. Kept ${imported.skipped} existing entries.`,
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
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 40 }}
      >
        <Card>
          <Text style={s.title}>Model</Text>
          <View style={{ marginTop: 16 }}>
            <ModelChoice
              compact
              value={settings.model}
              onChange={(model) => save({ model })}
            />
          </View>
          <Text style={[s.footnote, { marginTop: 12 }]}>
            We'll use the available model when your preferred model isn't
            available yet.
          </Text>
        </Card>
        <Card>
          <Text style={s.title}>Weight units</Text>
          <View style={[s.row, { marginTop: 16 }]}>
            {(["kg", "lb"] as const).map((units) => (
              <Chip
                key={units}
                title={units}
                selected={settings.units === units}
                onPress={() => save({ units })}
              />
            ))}
          </View>
        </Card>
        <Card>
          <Text style={s.title}>Recovery speed</Text>
          <View style={[s.row, { flexWrap: "wrap", marginTop: 16 }]}>
            {(["normal", "fast", "slow"] as const).map((speed) => (
              <Chip
                key={speed}
                title={speed[0]!.toUpperCase() + speed.slice(1)}
                selected={settings.recoverySpeed === speed}
                onPress={() => save({ recoverySpeed: speed })}
              />
            ))}
          </View>
          <Text style={[s.footnote, { marginTop: 12 }]}>
            Adjusts estimated recovery time. Your saved logs stay the same.
          </Text>
        </Card>
        <Card>
          <Text style={s.title}>Your data</Text>
          <Text style={[s.secondary, { marginTop: 8, marginBottom: 16 }]}>
            Keep a backup or bring your logs to another device.
          </Text>
          <View style={{ gap: 12 }}>
            <Button
              secondary
              title={busy ? "Please wait…" : "Export data"}
              disabled={busy}
              onPress={() => void transfer("export")}
            />
            <Button
              secondary
              title="Import data"
              disabled={busy}
              onPress={() => void transfer("import")}
            />
          </View>
        </Card>
        <Button
          secondary
          title="Privacy"
          onPress={() => router.push("/privacy")}
        />
        <Card>
          <Text style={s.text}>Content {content.release.contentVersion}</Text>
          <Text style={s.secondary}>
            {content.release.exercises.length} approved exercises · available
            offline
          </Text>
          <Text style={s.footnote}>
            App {Constants.expoConfig?.version ?? "0.1.0"}
          </Text>
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
