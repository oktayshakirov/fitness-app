import type React from "react";
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextProps,
  type TextStyle,
} from "react-native";
import { fonts } from "../theme";
/** Custom fonts ignore fontWeight on Android, so pick the Poppins family per weight. */
function withFont(style: TextProps["style"]) {
  const { fontWeight, ...rest } = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const weight = fontWeight === "bold" ? "700" : String(fontWeight ?? "400");
  const family = fonts[weight as keyof typeof fonts] ?? (Number(weight) > 600 ? fonts["700"] : fonts["400"]);
  return [{ fontFamily: rest.fontFamily ?? family }, rest];
}
export function Text({ style, ...props }: TextProps) {
  return <NativeText {...props} style={withFont(style)} />;
}
export function TextInput({ style, ...props }: React.ComponentProps<typeof NativeTextInput>) {
  return <NativeTextInput {...props} style={withFont(style)} />;
}
