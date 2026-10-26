import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen, Heading, Button, Chip, s } from "../src/components/ui";
import { ModelChoice } from "../src/components/ModelChoice";
import { updateSettings, useSettings } from "../src/storage/store";
import type { Model } from "../src/content/types";
import type { Units } from "../src/storage/preferences";
import { colors } from "../src/theme";
export default function Onboarding() {
  const settings = useSettings();
  const [model, setModel] = useState<Model>(settings.model);
  const [units, setUnits] = useState<Units>(settings.units);
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          gap: 24,
          flexGrow: 1,
          paddingBottom: 40,
        }}
      >
        <Text accessibilityRole="header" style={s.large}>
          Choose your model
        </Text>
        <Text style={s.secondary}>You can change this anytime.</Text>
        <ModelChoice value={model} onChange={setModel} />
        <Text style={s.footnote}>
          If your preferred model isn't available for an exercise yet, we'll
          show the available model.
        </Text>
        <View style={{ gap: 12 }}>
          <Text style={s.title}>Weight units</Text>
          <View style={s.row}>
            {(["kg", "lb"] as const).map((unit) => (
              <Chip
                key={unit}
                title={unit}
                selected={units === unit}
                onPress={() => setUnits(unit)}
              />
            ))}
          </View>
        </View>
        <View style={{ flex: 1 }} />
        <Button
          title="Continue"
          onPress={() => {
            try {
              updateSettings({ model, units, onboarded: true });
            } catch {
              Alert.alert("Could not save preferences", "Please try again.");
            }
          }}
        />
        <Button
          secondary
          title="Privacy"
          onPress={() => router.push("/privacy")}
        />
      </ScrollView>
    </Screen>
  );
}
