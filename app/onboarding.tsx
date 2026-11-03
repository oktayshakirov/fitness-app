import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../src/components/Text";
import { Screen, Button, IconCircle, Segmented, s } from "../src/components/ui";
import { ModelChoice } from "../src/components/ModelChoice";
import { content } from "../src/content";
import { updateSettings, useSettings } from "../src/storage/store";
import type { Model } from "../src/content/types";
import type { Units } from "../src/storage/preferences";
import { colors } from "../src/theme";
const steps = ["welcome", "model", "units"] as const;
type Step = (typeof steps)[number];
function Dots({ step }: { step: Step }) {
  return (
    <View style={[s.row, { gap: 6, justifyContent: "center" }]}>
      {steps.map((dot) => (
        <View
          key={dot}
          style={{
            width: dot === step ? 22 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: dot === step ? colors.accent : colors.surface3,
          }}
        />
      ))}
    </View>
  );
}
export default function Onboarding() {
  const settings = useSettings();
  const [step, setStep] = useState<Step>("welcome");
  const [model, setModel] = useState<Model>(settings.model);
  const [units, setUnits] = useState<Units>(settings.units);
  const { male, female } = content.release.heroes;
  function finish() {
    try {
      updateSettings({ model, units, onboarded: true });
    } catch {
      Alert.alert("Could not save preferences", "Please try again.");
    }
  }
  if (step === "welcome")
    return (
      <Screen>
        <View style={{ flex: 1, padding: 20, paddingBottom: 28 }}>
          <View style={[s.row, { justifyContent: "center", gap: 6, marginTop: 8 }]}>
            <Ionicons name="pulse" size={18} color={colors.accent} />
            <Text style={{ color: colors.accent, fontSize: 15, fontWeight: "700", letterSpacing: 2 }}>
              FITNESS
            </Text>
          </View>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Image
              source={require("../assets/ui/glow.png")}
              style={{ position: "absolute", width: "130%", aspectRatio: 1, opacity: 0.45 }}
            />
            <View style={{ flexDirection: "row", width: "100%", height: "92%" }}>
              {[male, female].map(
                (hero, i) =>
                  hero && (
                    <Image
                      key={i}
                      source={content.resolve(hero)}
                      contentFit="contain"
                      style={{ flex: 1, marginHorizontal: -28 }}
                    />
                  ),
              )}
            </View>
          </View>
          <View style={{ gap: 10, alignItems: "center" }}>
            <Text style={s.subhead}>Welcome</Text>
            <Text accessibilityRole="header" style={[s.large, { textAlign: "center" }]}>
              Train with correct form
            </Text>
            <Text style={[s.subhead, { textAlign: "center", fontSize: 15, lineHeight: 22 }]}>
              3D exercise loops, muscle recovery and one-tap logging. No account needed.
            </Text>
          </View>
          <View style={{ marginTop: 24, gap: 20 }}>
            <Dots step={step} />
            <Button title="Get started" arrow onPress={() => setStep("model")} />
          </View>
        </View>
      </Screen>
    );
  return (
    <Screen>
      <View style={[s.row, { paddingHorizontal: 16, minHeight: 48 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          onPress={() => setStep(step === "units" ? "model" : "welcome")}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.surface,
          }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Dots step={step} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 12, gap: 20, flexGrow: 1, paddingBottom: 28 }}>
        {step === "model" ? (
          <>
            <View style={{ gap: 6 }}>
              <Text accessibilityRole="header" style={s.large}>
                Choose your model
              </Text>
              <Text style={s.subhead}>Every exercise is shown on this body. You can change it anytime.</Text>
            </View>
            <ModelChoice value={model} onChange={setModel} />
            <View style={{ flex: 1 }} />
            <Button title="Continue" arrow onPress={() => setStep("units")} />
          </>
        ) : (
          <>
            <View style={{ gap: 6 }}>
              <Text accessibilityRole="header" style={s.large}>
                Weight units
              </Text>
              <Text style={s.subhead}>Used when you log sets. Change it anytime in Settings.</Text>
            </View>
            <Segmented
              label="Weight units"
              value={units}
              onChange={setUnits}
              options={[
                { value: "kg", title: "Kilograms" },
                { value: "lb", title: "Pounds" },
              ]}
            />
            <View style={[s.card, { gap: 16 }]}>
              {(
                [
                  ["body", "See which muscles are recovering"],
                  ["play", "Learn each exercise from a 3D loop"],
                  ["add", "Log a workout in one tap"],
                  ["lock-closed", "Your data stays on this phone"],
                ] as const
              ).map(([icon, text]) => (
                <View key={text} style={[s.row, { gap: 14 }]}>
                  <IconCircle name={icon} size={36} />
                  <Text style={[s.text, { flex: 1 }]}>{text}</Text>
                </View>
              ))}
            </View>
            <View style={{ flex: 1 }} />
            <Button title="Start training" arrow onPress={finish} />
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push("/privacy")}
              style={{ minHeight: 44, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={s.footnote}>
                How your data is handled: <Text style={{ color: colors.accent }}>Privacy</Text>
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
