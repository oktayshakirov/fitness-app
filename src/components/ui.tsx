import React, { useEffect, useRef, useState, type PropsWithChildren } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Icon } from "./Icon";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { Text } from "./Text";
import { PressableScale, settle } from "./motion";
import { colors, contentWidth, fonts, radius, type, themed } from "../theme";
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
    <View style={[s.heading, s.column]}>
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
          <Text style={[s.subhead, { color: colors.accentInk }]}>{action}</Text>
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
      <Icon
        name={name}
        size={size * 0.5}
        color={color ? colors.onAccent : dim ? colors.accentInk : colors.onAccent}
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
  onPress,
  hint,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: IconName;
  footer?: React.ReactNode;
  /** Spoken after the value, e.g. what the footer shows. */
  description?: string;
  onPress?: () => void;
  /** Spoken hint for what a tap opens. */
  hint?: string;
}) {
  const a11y = `${label}: ${value} ${unit ?? ""}${description ? `. ${description}` : ""}`;
  const tile = [s.card, { flex: 1, padding: 16, gap: 14 }];
  const body = (
    <>
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
    </>
  );
  return onPress ? (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityHint={hint}
      onPress={onPress}
      scaleTo={0.97}
      style={tile}
    >
      {body}
    </PressableScale>
  ) : (
    <View accessible accessibilityLabel={a11y} style={tile}>
      {body}
    </View>
  );
}
export function IconButton({
  name,
  label,
  onPress,
  disabled = false,
  plain = false,
  color = colors.text,
  selected,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  plain?: boolean;
  color?: string;
  /** For toggles such as a favourite star. */
  selected?: boolean;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      accessibilityState={{ disabled, selected }}
      onPress={onPress}
      hitSlop={4}
      scaleTo={0.88}
      style={[s.icon, plain && { backgroundColor: "transparent" }, { opacity: disabled ? 0.3 : 1 }]}
    >
      <Icon name={name} size={22} color={color} />
    </PressableScale>
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
    <PressableScale
      accessibilityRole="button"
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={[
        s.button,
        {
          backgroundColor: secondary || destructive ? colors.surface2 : colors.accent,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
    >
      {icon && <Icon name={icon} size={20} color={color} />}
      <Text style={[s.buttonText, { color }]}>{title}</Text>
      {arrow && (
        <View style={s.arrow}>
          <Icon name="arrow-forward" size={20} color={colors.accent} />
        </View>
      )}
    </PressableScale>
  );
}
/** Small lime-on-dim pill for header shortcuts such as "Today" or "Clear". */
export function PillButton({
  title,
  label,
  onPress,
}: {
  title: string;
  /** Spoken label when the visible title is shorter. */
  label?: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label ?? title}
      hitSlop={8}
      onPress={onPress}
      scaleTo={0.94}
      style={{
        minHeight: 36,
        paddingHorizontal: 16,
        borderRadius: 18,
        justifyContent: "center",
        backgroundColor: colors.accentDim,
      }}
    >
      <Text style={[s.subhead, { color: colors.accentInk, fontWeight: "600" }]}>{title}</Text>
    </PressableScale>
  );
}
export function Chip({
  title,
  selected,
  onPress,
  icon,
  ionicon,
  dot,
}: {
  title: string;
  selected: boolean;
  onPress: () => void;
  icon?: MediaSource;
  /** A vector icon before the title, e.g. a star. */
  ionicon?: IconName;
  dot?: string;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      scaleTo={0.94}
      style={[s.chip, !!icon && { paddingLeft: 6 }, selected && s.selected]}
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
      {ionicon && <Icon name={ionicon} size={16} color={selected ? colors.onAccent : colors.accentInk} />}
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
    </PressableScale>
  );
}
/** Label whose colour follows the sliding pill: dark on lime, grey elsewhere. */
function SegmentLabel({
  title,
  index,
  segment,
  x,
  selected,
}: {
  title: string;
  index: number;
  segment: number;
  x: SharedValue<number>;
  selected: boolean;
}) {
  // Plain strings, not `colors`: a worklet freezes the objects it captures.
  const on = colors.onAccent;
  const off = colors.secondary;
  const color = useAnimatedStyle(() => {
    if (!segment) return { color: selected ? on : off };
    const distance = Math.min(1, Math.abs(x.value - index * segment) / segment);
    return { color: interpolateColor(distance, [0, 1], [on, off]) };
  });
  return (
    <Animated.Text
      numberOfLines={1}
      style={[
        { fontFamily: fonts["500"], fontSize: type.subhead.fontSize, lineHeight: type.subhead.lineHeight },
        color,
      ]}
    >
      {title}
    </Animated.Text>
  );
}
/** Pill segmented control; a lime pill slides to the selected segment. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  /** `accessibilityLabel` is read instead of a short `title` (e.g. "3" → "3 days"). */
  options: { value: T; title: string; accessibilityLabel?: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  // Segments are equal flex children inside 4 pt of padding.
  const segment = width ? (width - 8) / options.length : 0;
  const x = useSharedValue(0);
  const placed = useRef(false);
  useEffect(() => {
    if (!segment) return;
    // The first measurement places the pill without sliding in from the left.
    x.value = placed.current ? withSpring(index * segment, settle) : index * segment;
    placed.current = true;
  }, [index, segment, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={label}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={s.segmented}
    >
      {segment > 0 && <Animated.View pointerEvents="none" style={[s.pill, { width: segment }, pill]} />}
      {options.map((option, i) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.accessibilityLabel}
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              void Haptics.selectionAsync();
              onChange(option.value);
            }}
            // Until measured there is no pill, so the segment itself is lime.
            style={[s.segment, selected && !segment && { backgroundColor: colors.accent }]}
          >
            <SegmentLabel title={option.title} index={i} segment={segment} x={x} selected={selected} />
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
  destructive = false,
  children,
}: PropsWithChildren<{
  title: string;
  detail?: string;
  value?: string;
  icon?: IconName;
  onPress?: () => void;
  chevron?: boolean;
  /** Red title and icon, for actions such as erasing data. */
  destructive?: boolean;
}>) {
  const body = (
    <View style={s.rowItem}>
      {icon && <IconCircle name={icon} size={36} dim={!destructive} color={destructive ? colors.trained : undefined} />}
      <View style={{ flex: 1 }}>
        <Text style={[s.headline, destructive && { color: colors.trained }]}>{title}</Text>
        {!!detail && <Text style={s.footnote}>{detail}</Text>}
      </View>
      {!!value && <Text style={[s.subhead, { flexShrink: 1 }]}>{value}</Text>}
      {children}
      {chevron && <Icon name="chevron-forward" size={18} color={colors.tertiary} />}
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
  action,
}: {
  title: string;
  description: string;
  icon?: IconName;
  /** Optional secondary button below the text, e.g. "Clear filters". */
  action?: { title: string; onPress: () => void };
}) {
  return (
    <View style={s.empty}>
      {icon && <IconCircle name={icon} size={52} dim />}
      <Text accessibilityRole="header" style={[s.headline, { textAlign: "center" }]}>
        {title}
      </Text>
      <Text style={[s.subhead, { textAlign: "center" }]}>{description}</Text>
      {action && (
        <View style={{ marginTop: 8, alignSelf: "stretch" }}>
          <Button secondary title={action.title} onPress={action.onPress} />
        </View>
      )}
    </View>
  );
}
export const s = themed(() => ({
  screen: { flex: 1, backgroundColor: colors.bg },
  /** Centres content on wide windows (iPad); a no-op on phones. */
  column: { width: "100%", maxWidth: contentWidth, alignSelf: "center" },
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
  pill: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
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
}));
