import { useSyncExternalStore } from "react";
import { StyleSheet } from "react-native";

import { colors, palettes, type Palette, type Scheme } from "./palettes";

export { colors, palettes, type Palette, type Scheme };

let current: Scheme = "dark";
const listeners = new Set<() => void>();

/** Switches the palette. Call `notifyScheme()` after render so mounted screens repaint. */
export function setScheme(next: Scheme) {
  if (next === current) return false;
  current = next;
  Object.assign(colors, palettes[next]);
  return true;
}
export function notifyScheme() {
  listeners.forEach((l) => l());
}
export function useScheme() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => void listeners.delete(l)),
    () => current,
  );
}

type Styles = Parameters<typeof StyleSheet.create>[0];
/** StyleSheet.create for styles that use `colors`: built once per scheme, read through a proxy. */
export function themed<S extends Styles>(make: () => S & Styles): Readonly<S> {
  const sheets: Partial<Record<Scheme, Readonly<S>>> = {};
  return new Proxy({} as Readonly<S>, {
    get(_, key) {
      const sheet = (sheets[current] ??= StyleSheet.create(make()));
      return sheet[key as keyof S];
    },
  });
}
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;
export const radius = { chip: 22, card: 24, media: 24, pill: 30 } as const;
/** Poppins is loaded at startup; each weight is its own family. */
export const fonts = {
  "400": "Poppins_400Regular",
  "500": "Poppins_500Medium",
  "600": "Poppins_600SemiBold",
  "700": "Poppins_700Bold",
} as const;
export const type = {
  large: { fontSize: 30, fontWeight: "600" as const, lineHeight: 38 },
  title: { fontSize: 20, fontWeight: "600" as const, lineHeight: 28 },
  headline: { fontSize: 16, fontWeight: "500" as const, lineHeight: 22 },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 22 },
  subhead: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
  footnote: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: "500" as const, lineHeight: 16 },
};
/** Bottom space screens leave for the floating tab bar. */
export const tabBarSpace = 110;
