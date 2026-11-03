export const colors = {
  bg: "#0B0B0C",
  surface: "#1A1A1C",
  surface2: "#252528",
  surface3: "#323236",
  separator: "rgba(255,255,255,0.08)",
  text: "#FFFFFF",
  secondary: "rgba(235,235,245,0.62)",
  tertiary: "rgba(235,235,245,0.32)",
  accent: "#C8FA3C",
  onAccent: "#0B0B0C",
  accentDim: "rgba(200,250,60,0.14)",
  trained: "#FF4D3D",
  recovering: "#FF9F0A",
  almost: "#FFD60A",
  ready: "#C8FA3C",
} as const;
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
