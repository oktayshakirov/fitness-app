import { useCallback, useState } from "react";
import { Alert, BackHandler, Pressable, ScrollView, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { Icon } from "../src/components/Icon";
import { modelImages } from "../src/components/modelImages";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  ZoomIn,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { motion } from "../src/components/motion";
import { Text } from "../src/components/Text";
import { Screen, Button, IconCircle, s, type IconName } from "../src/components/ui";
import { ModelChoice } from "../src/components/ModelChoice";
import { updateSettings, useSettings } from "../src/storage/store";
import type { Model } from "../src/content/types";
import type { Appearance, Units } from "../src/storage/preferences";
import { colors, useScheme } from "../src/theme";
export { ScreenError as ErrorBoundary } from "../src/components/ErrorScreen";
const steps = ["welcome", "model", "units", "appearance", "ready"] as const;
type Step = (typeof steps)[number];
const appearanceChoices: { value: Appearance; title: string; detail: string; icon: IconName }[] = [
  { value: "system", title: "Automatic", detail: "Match your device's setting", icon: "phone-portrait-outline" },
  { value: "light", title: "Light", detail: "Bright screens for daytime", icon: "sunny-outline" },
  { value: "dark", title: "Dark", detail: "Easy on the eyes in the gym", icon: "moon-outline" },
];
/** Page dot that stretches into a lime bar for the current step. */
function Dot({ active }: { active: boolean }) {
  // Copy the colour out first: a worklet freezes the objects it captures, and `colors` changes with the theme.
  const fill = active ? colors.accentInk : colors.surface3;
  const style = useAnimatedStyle(() => ({
    width: withTiming(active ? 22 : 6, { duration: motion.base }),
    backgroundColor: withTiming(fill, { duration: motion.base }),
  }));
  return <Animated.View style={[{ height: 6, borderRadius: 3 }, style]} />;
}
function Dots({ step }: { step: Step }) {
  return (
    <View style={[s.row, { gap: 6, justifyContent: "center" }]}>
      {steps.map((dot) => (
        <Dot key={dot} active={dot === step} />
      ))}
    </View>
  );
}
export default function Onboarding() {
  useScheme();
  const settings = useSettings();
  const [step, setStep] = useState<Step>("welcome");
  const [model, setModel] = useState<Model>(settings.model);
  const [units, setUnits] = useState<Units>(settings.units);
  // Forward steps slide in from the right, going back slides in from the left.
  const [direction, setDirection] = useState(1);
  const go = (next: Step) => {
    setDirection(1);
    setStep(next);
  };
  const back = useCallback(() => {
    setDirection(-1);
    setStep((current) => steps[Math.max(0, steps.indexOf(current) - 1)]!);
  }, []);
  // Android back steps through onboarding instead of leaving the app. Only while
  // focused, so it never swallows the back press that closes Privacy.
  useFocusEffect(
    useCallback(() => {
      if (step === "welcome") return;
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        back();
        return true;
      });
      return () => sub.remove();
    }, [step, back]),
  );
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
        <View style={[s.column, { flex: 1, padding: 20, paddingBottom: 28 }]}>
          <View style={[s.row, { justifyContent: "center", gap: 8, marginTop: 8 }]}>
            <Image
              source={require("../assets/brand/logo.png")}
              contentFit="contain"
              accessible={false}
              style={{ width: 34, height: 34 }}
            />
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>Muscle Pal</Text>
          </View>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Image
              source={require("../assets/ui/glow.png")}
              style={{ position: "absolute", width: "130%", aspectRatio: 1, opacity: 0.45 }}
            />
            <Animated.View
              entering={FadeIn.duration(500)}
              style={{ flexDirection: "row", width: "100%", height: "92%" }}
            >
              {(["male", "female"] as const).map((m) => (
                <Image
                  key={m}
                  source={modelImages[m].body}
                  contentFit="contain"
                  accessible={false}
                  style={{ flex: 1, marginHorizontal: -28 }}
                />
              ))}
            </Animated.View>
          </View>
          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={{ gap: 10, alignItems: "center" }}>
            <Text style={s.subhead}>Welcome</Text>
            <Text accessibilityRole="header" style={[s.large, { textAlign: "center" }]}>
              Train with correct form
            </Text>
            <Text style={[s.subhead, { textAlign: "center", fontSize: 15, lineHeight: 22 }]}>
              3D exercise loops, muscle recovery and one-tap logging. No account needed.
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(220).duration(400)} style={{ marginTop: 24, gap: 20 }}>
            <Dots step={step} />
            <Button title="Get started" arrow onPress={() => go("model")} />
          </Animated.View>
        </View>
      </Screen>
    );
  return (
    <Screen>
      <View style={[s.row, s.column, { paddingHorizontal: 16, minHeight: 48 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          onPress={back}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.surface,
          }}
        >
          <Icon name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Dots step={step} />
      </View>
      <ScrollView contentContainerStyle={[{ padding: 20, paddingTop: 12, gap: 20, flexGrow: 1, paddingBottom: 28 }, s.column]}>
        <Animated.View
          key={step}
          entering={(direction > 0 ? FadeInRight : FadeInLeft).duration(motion.base)}
          style={{ flex: 1, gap: 20 }}
        >
          {step === "model" ? (
            <>
              <View style={{ gap: 6 }}>
                <Text accessibilityRole="header" style={s.large}>
                  Choose your model
                </Text>
                <Text style={s.subhead}>Exercises are shown on a matching 3D model. You can change it anytime.</Text>
              </View>
              <ModelChoice value={model} onChange={setModel} />
              <View style={{ flex: 1 }} />
              <Button title="Continue" arrow onPress={() => go("units")} />
            </>
          ) : step === "units" ? (
            <>
              <View style={{ gap: 6 }}>
                <Text accessibilityRole="header" style={s.large}>
                  Weight units
                </Text>
                <Text style={s.subhead}>Used when you log sets. Change it anytime in Profile.</Text>
              </View>
              <View style={{ gap: 12 }}>
                {(
                  [
                    ["kg", "Kilograms", "Metric, plates in 2.5 kg steps"],
                    ["lb", "Pounds", "Imperial, plates in 5 lb steps"],
                  ] as const
                ).map(([value, title, detail]) => {
                  const selected = units === value;
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={title}
                      onPress={() => setUnits(value)}
                      style={({ pressed }) => [
                        s.row,
                        {
                          gap: 16,
                          padding: 18,
                          borderRadius: 24,
                          borderWidth: 2,
                          borderColor: selected ? colors.accentInk : colors.surface,
                          backgroundColor: selected ? colors.accentDim : colors.surface,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: selected ? colors.accent : colors.surface2,
                        }}
                      >
                        <Text style={{ fontSize: 18, fontWeight: "700", color: selected ? colors.onAccent : colors.text }}>
                          {value}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.title}>{title}</Text>
                        <Text style={s.footnote}>{detail}</Text>
                      </View>
                      <Icon
                        name={selected ? "checkmark-circle" : "ellipse-outline"}
                        size={24}
                        color={selected ? colors.accentInk : colors.secondary}
                      />
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ flex: 1 }} />
              <Button title="Continue" arrow onPress={() => go("appearance")} />
            </>
          ) : step === "appearance" ? (
            <>
              <View style={{ gap: 6 }}>
                <Text accessibilityRole="header" style={s.large}>
                  Appearance
                </Text>
                <Text style={s.subhead}>Light or dark. Change it anytime in Profile.</Text>
              </View>
              <View style={{ gap: 12 }}>
                {appearanceChoices.map(({ value, title, detail, icon }) => {
                  const selected = settings.appearance === value;
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={title}
                      // Saved straight away so the screen switches while choosing.
                      onPress={() => updateSettings({ appearance: value })}
                      style={({ pressed }) => [
                        s.row,
                        {
                          gap: 16,
                          padding: 18,
                          borderRadius: 24,
                          borderWidth: 2,
                          borderColor: selected ? colors.accentInk : colors.surface,
                          backgroundColor: selected ? colors.accentDim : colors.surface,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: selected ? colors.accent : colors.surface2,
                        }}
                      >
                        <Icon name={icon} size={26} color={selected ? colors.onAccent : colors.text} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.title}>{title}</Text>
                        <Text style={s.footnote}>{detail}</Text>
                      </View>
                      <Icon
                        name={selected ? "checkmark-circle" : "ellipse-outline"}
                        size={24}
                        color={selected ? colors.accentInk : colors.secondary}
                      />
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ flex: 1 }} />
              <Button title="Continue" arrow onPress={() => go("ready")} />
            </>
          ) : (
            <>
              <View style={{ alignItems: "center", marginTop: 12 }}>
                <Image
                  source={require("../assets/ui/glow.png")}
                  style={{ position: "absolute", width: 260, height: 260, top: -70, opacity: 0.5 }}
                />
                <Animated.View
                  entering={ZoomIn.delay(80).springify().damping(14)}
                  style={{
                    width: 112,
                    height: 112,
                    borderRadius: 56,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.accent,
                  }}
                >
                  <Icon name="checkmark" size={56} color={colors.onAccent} />
                </Animated.View>
              </View>
              <View style={{ gap: 6, alignItems: "center", marginTop: 8 }}>
                <Text accessibilityRole="header" style={[s.large, { textAlign: "center" }]}>
                  You're all set
                </Text>
                <View style={[s.row, { gap: 8 }]}>
                  {[`${model === "male" ? "Male" : "Female"} model`, units === "kg" ? "Kilograms" : "Pounds"].map((chip) => (
                    <View
                      key={chip}
                      style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: colors.surface3 }}
                    >
                      <Text style={[s.caption, { color: colors.text }]}>{chip}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={[s.card, { gap: 18, marginTop: 8 }]}>
                {(
                  [
                    ["body", "Recovery at a glance", "Your body map shows which muscles need rest"],
                    ["play", "Correct form", "Every exercise is a 3D loop from several angles"],
                    ["add", "One-tap logging", "Tap + on any exercise, add sets if you like"],
                    ["lock-closed", "Private by default", "No account. Your data stays on this device"],
                  ] as const
                ).map(([icon, title, detail], i) => (
                  <Animated.View
                    key={title}
                    entering={FadeInDown.delay(160 + i * 70).duration(motion.base)}
                    style={[s.row, { gap: 14 }]}
                  >
                    <IconCircle name={icon} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.headline}>{title}</Text>
                      <Text style={s.footnote}>{detail}</Text>
                    </View>
                  </Animated.View>
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
                  How your data is handled: <Text style={{ color: colors.accentInk }}>Privacy</Text>
                </Text>
              </Pressable>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}
