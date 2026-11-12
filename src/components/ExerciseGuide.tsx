import type { PropsWithChildren } from "react";
import { View } from "react-native";
import { Text } from "./Text";
import { Icon } from "./Icon";
import { Button, s } from "./ui";
import { showPaywall, useIsPro } from "../pro/pro";
import type { Exercise } from "../content/types";
import { colors } from "../theme";

type IconName = Parameters<typeof Icon>[0]["name"];

/**
 * The written guide under the video: How to, Cues, Common mistakes and Breathing, always open.
 * Common mistakes is a Pro perk: free users see redacted lines and an unlock button, never the text.
 */
export function ExerciseGuide({ exercise }: { exercise: Exercise }) {
  const isPro = useIsPro();
  const cues = exercise.cues.filter(Boolean);
  const mistakes = exercise.mistakes.filter(Boolean);
  const steps = exercise.steps.filter(Boolean);
  return (
    <View style={{ gap: 12 }}>
      {steps.length > 0 && (
        <GuideCard icon="list" title="How to">
          {steps.map((step, i) => (
            <Line key={i} marker={<Number n={i + 1} />}>
              {step}
            </Line>
          ))}
        </GuideCard>
      )}
      {cues.length > 0 && (
        <GuideCard icon="bulb-outline" title="Cues">
          {cues.map((cue, i) => (
            <Line key={i} marker={<Icon name="checkmark-circle" size={20} color={colors.accentInk} />}>
              {cue}
            </Line>
          ))}
        </GuideCard>
      )}
      {mistakes.length > 0 && (
        <GuideCard icon="warning-outline" title="Common mistakes" pro={!isPro}>
          {isPro ? (
            mistakes.map((mistake, i) => (
              <Line key={i} marker={<Icon name="close-circle" size={20} color={colors.trained} />}>
                {mistake}
              </Line>
            ))
          ) : (
            <Locked lines={mistakes} />
          )}
        </GuideCard>
      )}
      {!!exercise.breathing && (
        <GuideCard icon="pulse" title="Breathing">
          <Text style={s.secondary}>{exercise.breathing}</Text>
        </GuideCard>
      )}
    </View>
  );
}

function GuideCard({
  icon,
  title,
  pro = false,
  children,
}: PropsWithChildren<{ icon: IconName; title: string; pro?: boolean }>) {
  return (
    <View style={[s.card, { gap: 14 }]}>
      <View style={[s.row, { gap: 10 }]} accessibilityRole="header">
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.accentDim,
          }}
        >
          <Icon name={icon} size={17} color={colors.accentInk} />
        </View>
        <Text style={[s.headline, { flex: 1 }]}>{title}</Text>
        {pro && (
          <View style={{ borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: colors.accent }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.onAccent }}>PRO</Text>
          </View>
        )}
      </View>
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

function Line({ marker, children }: PropsWithChildren<{ marker: React.ReactNode }>) {
  return (
    <View style={[s.row, { alignItems: "flex-start", gap: 12 }]}>
      <View style={{ width: 24, alignItems: "center", paddingTop: 1 }}>{marker}</View>
      <Text style={[s.secondary, { flex: 1 }]}>{children}</Text>
    </View>
  );
}

function Number({ n }: { n: number }) {
  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.accentDim,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: colors.accentInk, fontSize: 13, fontWeight: "700" }}>{n}</Text>
    </View>
  );
}

/** Grey bars shaped like the hidden lines (about 38 characters per bar), then the way to unlock them. */
function Locked({ lines }: { lines: string[] }) {
  const shown = lines.slice(0, 3);
  return (
    <View style={{ gap: 16 }}>
      <View
        style={{ gap: 12 }}
        accessible
        accessibilityLabel={`${lines.length} common mistakes, available with Muscle Pal Pro`}
      >
        {shown.map((line, i) => {
          const bars = Math.min(3, Math.max(1, Math.ceil(line.length / 38)));
          return (
            <View key={i} style={[s.row, { alignItems: "flex-start", gap: 12 }]}>
              <View style={{ width: 24, alignItems: "center", paddingTop: 1 }}>
                <Icon name="lock-closed" size={18} color={colors.tertiary} />
              </View>
              <View style={{ flex: 1, gap: 7, paddingTop: 4 }}>
                {Array.from({ length: bars }, (_, b) => (
                  <View
                    key={b}
                    style={{
                      height: 11,
                      borderRadius: 6,
                      backgroundColor: colors.surface3,
                      // Last bar of a line is shorter, like the end of a sentence; one-bar lines vary too.
                      width:
                        b < bars - 1
                          ? "100%"
                          : bars > 1
                            ? `${45 + ((line.length * 7) % 40)}%`
                            : `${Math.min(100, 45 + line.length * 1.5)}%`,
                    }}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>
      <Text style={s.footnote}>
        See the {lines.length === 1 ? "mistake" : `${lines.length} mistakes`} people make most on this exercise,
        and how to avoid them, with Muscle Pal Pro.
      </Text>
      <Button title="Unlock with Pro" icon="lock-open-outline" onPress={() => void showPaywall()} />
    </View>
  );
}
