import React, { type PropsWithChildren } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Text } from "./Text";
import { colors, radius, type } from "../theme";
import type { MediaSource } from "../content/types";
export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      {children}
    </SafeAreaView>
  );
}
export function Heading({
  title,
  eyebrow,
  subtitle,
  action,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={s.heading}>
      <View style={{ flexShrink: 1 }}>
        {!!eyebrow && <Text style={s.subhead}>{eyebrow}</Text>}
        <Text accessibilityRole="header" style={s.large}>
          {title}
        </Text>
        {!!subtitle && <Text style={[s.subhead, { marginTop: 2 }]}>{subtitle}</Text>}
      </View>
      {action}
    </View>
  );
}
/** Section header: white title with an optional lime "See all"-style link. */
export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={[s.row, { justifyContent: "space-between", marginTop: 8 }]}>
      <Text accessibilityRole="header" style={s.title}>
        {title}
      </Text>
      {!!action && (
        <Pressable accessibilityRole="button" hitSlop={10} onPress={onAction}>
          <Text style={[s.subhead, { color: colors.accent }]}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}
export function SectionLabel({ title }: { title: string }) {
  return <Text style={s.caption}>{title}</Text>;
}
export function Card({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[s.card, style]}>{children}</View>;
}
/** Round icon badge: lime with a dark glyph, or dim with a lime glyph. */
export function IconCircle({
  name,
  size = 40,
  dim = false,
  color,
}: {
  name: IconName;
  size?: number;
  dim?: boolean;
  color?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: color ?? (dim ? colors.accentDim : colors.accent),
      }}
    >
      <Ionicons
        name={name}
        size={size * 0.5}
        color={color ? colors.onAccent : dim ? colors.accent : colors.onAccent}
      />
    </View>
  );
}
/** Stat tile: label and icon on top, big number below, optional one-line footer. */
export function Stat({
  label,
  value,
  unit,
  icon,
  footer,
  description,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: IconName;
  footer?: React.ReactNode;
  /** Spoken after the value, e.g. what the footer shows. */
  description?: string;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value} ${unit ?? ""}${description ? `. ${description}` : ""}`}
      style={[s.card, { flex: 1, padding: 16, gap: 14 }]}
    >
      <View style={[s.row, { justifyContent: "space-between", alignItems: "flex-start" }]}>
        <Text style={[s.subhead, { color: colors.text, flex: 1 }]} numberOfLines={2}>
          {label}
        </Text>
        <IconCircle name={icon} size={34} />
      </View>
      <Text style={{ ...type.large, color: colors.text, fontSize: 28 }}>
        {value}
        {!!unit && <Text style={[s.footnote, { color: colors.secondary }]}> {unit}</Text>}
      </Text>
      {footer ? <View style={{ minHeight: 18, justifyContent: "center", marginTop: -6 }}>{footer}</View> : null}
    </View>
  );
}
export function IconButton({
  name,
  label,
  onPress,
  disabled = false,
  plain = false,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  plain?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        s.icon,
        plain && { backgroundColor: "transparent" },
        { opacity: disabled ? 0.3 : pressed ? 0.6 : 1 },
      ]}
    >
      <Ionicons name={name} size={22} color={colors.text} />
    </Pressable>
  );
}
export function Button({
  title,
  onPress,
  icon,
  arrow = false,
  secondary = false,
  destructive = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  /** Trailing dark circle with an arrow, as on the main call to action. */
  arrow?: boolean;
  secondary?: boolean;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const color = destructive
    ? colors.trained
    : secondary
      ? colors.text
      : colors.onAccent;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        {
          backgroundColor: secondary || destructive ? colors.surface2 : colors.accent,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        },
      ]}
    >
      {icon && <Ionicons name={icon} size={20} color={color} />}
      <Text style={[s.buttonText, { color }]}>{title}</Text>
      {arrow && (
        <View style={s.arrow}>
          <Ionicons name="arrow-forward" size={20} color={colors.accent} />
        </View>
      )}
    </Pressable>
  );
}
export function Chip({
  title,
  selected,
  onPress,
  icon,
  dot,
}: {
  title: string;
  selected: boolean;
  onPress: () => void;
  icon?: MediaSource;
  dot?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        s.chip,
        !!icon && { paddingLeft: 6 },
        selected && s.selected,
        { opacity: pressed ? 0.75 : 1 },
      ]}
    >
      {icon && (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: selected ? colors.onAccent : colors.surface2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image source={icon} contentFit="contain" style={{ width: 28, height: 28 }} />
        </View>
      )}
      {dot && (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
      )}
      <Text
        style={{
          ...type.subhead,
          fontWeight: "500",
          color: selected ? colors.onAccent : colors.text,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
/** Pill segmented control; the selected segment is lime. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; title: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={s.segmented}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              void Haptics.selectionAsync();
              onChange(option.value);
            }}
            style={[s.segment, selected && { backgroundColor: colors.accent }]}
          >
            <Text
              numberOfLines={1}
              style={{
                ...type.subhead,
                fontWeight: "500",
                color: selected ? colors.onAccent : colors.secondary,
              }}
            >
              {option.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
/** Grouped inset list (Profile). Rows are separated by hairlines. */
export function Group({ children }: PropsWithChildren) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={s.group}>
      {rows.map((row, i) => (
        <View key={i}>
          {i > 0 && <View style={s.hairline} />}
          {row}
        </View>
      ))}
    </View>
  );
}
export function Row({
  title,
  detail,
  value,
  icon,
  onPress,
  chevron = !!onPress,
  children,
}: PropsWithChildren<{
  title: string;
  detail?: string;
  value?: string;
  icon?: IconName;
  onPress?: () => void;
  chevron?: boolean;
}>) {
  const body = (
    <View style={s.rowItem}>
      {icon && <IconCircle name={icon} size={36} dim />}
      <View style={{ flex: 1 }}>
        <Text style={s.headline}>{title}</Text>
        {!!detail && <Text style={s.footnote}>{detail}</Text>}
      </View>
      {!!value && <Text style={[s.subhead, { flexShrink: 1 }]}>{value}</Text>}
      {children}
      {chevron && <Ionicons name="chevron-forward" size={18} color={colors.tertiary} />}
    </View>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && { backgroundColor: colors.surface2 }}
    >
      {body}
    </Pressable>
  ) : (
    body
  );
}
export function Empty({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: IconName;
}) {
  return (
    <View style={s.empty}>
      {icon && <IconCircle name={icon} size={52} dim />}
      <Text accessibilityRole="header" style={[s.headline, { textAlign: "center" }]}>
        {title}
      </Text>
      <Text style={[s.subhead, { textAlign: "center" }]}>{description}</Text>
    </View>
  );
}
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  heading: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  large: { ...type.large, color: colors.text, flexShrink: 1 },
  title: { ...type.title, color: colors.text },
  headline: { ...type.headline, color: colors.text },
  text: { ...type.body, color: colors.text },
  subhead: { ...type.subhead, color: colors.secondary },
  secondary: { ...type.body, color: colors.secondary, lineHeight: 24 },
  footnote: { ...type.footnote, color: colors.secondary },
  caption: { ...type.caption, color: colors.secondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 18,
  },
  icon: {
    flexShrink: 0,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: colors.surface,
  },
  button: {
    minHeight: 56,
    paddingHorizontal: 22,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
  },
  buttonText: { ...type.headline, fontWeight: "600" },
  arrow: {
    position: "absolute",
    right: 6,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.onAccent,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.chip,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  selected: { backgroundColor: colors.accent, borderColor: colors.accent },
  segmented: {
    flexDirection: "row",
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    overflow: "hidden",
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: 66,
  },
  rowItem: {
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  empty: { padding: 28, gap: 10, alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
});
