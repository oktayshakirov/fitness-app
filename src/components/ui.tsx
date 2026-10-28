import React, { type PropsWithChildren } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, radius, type } from "../theme";
export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      {children}
    </SafeAreaView>
  );
}
export function Heading({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={s.heading}>
      <Text accessibilityRole="header" style={[s.large, { flexShrink: 1 }]}>
        {title}
      </Text>
      {action}
    </View>
  );
}
export function Card({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function IconButton({
  name,
  label,
  onPress,
  disabled = false,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={({ pressed }) => [
        s.icon,
        { opacity: disabled ? 0.3 : pressed ? 0.6 : 1 },
      ]}
    >
      <Ionicons name={name} size={24} color={colors.text} />
    </Pressable>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        {
          backgroundColor: secondary ? colors.surface2 : colors.accent,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text
        style={[s.buttonText, { color: secondary ? colors.text : colors.bg }]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Chip({
  title,
  selected,
  onPress,
}: {
  title: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={[s.chip, selected && s.selected]}
    >
      <Text
        style={{
          ...type.footnote,
          fontWeight: "600",
          color: selected ? colors.bg : colors.text,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Empty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={s.empty}>
      <Text
        accessibilityRole="header"
        style={[s.title, { textAlign: "center" }]}
      >
        {title}
      </Text>
      <Text style={[s.secondary, { textAlign: "center" }]}>{description}</Text>
    </View>
  );
}
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  heading: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  large: { ...type.large, color: colors.text, flexShrink: 1 },
  title: { ...type.title, color: colors.text },
  text: { ...type.body, color: colors.text },
  secondary: { ...type.body, color: colors.secondary, lineHeight: 24 },
  footnote: { ...type.footnote, color: colors.secondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
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
    minHeight: 52,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.card,
  },
  buttonText: { ...type.body, fontWeight: "600" },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.chip,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  selected: { backgroundColor: colors.accent },
  empty: { padding: 28, gap: 10, alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
});
