export const colors = {
  bg: "#000000",
  video: "#0A0A0C",
  surface: "#1C1C1E",
  surface2: "#2C2C2E",
  separator: "rgba(84,84,88,0.6)",
  text: "#FFFFFF",
  secondary: "rgba(235,235,245,0.6)",
  tertiary: "rgba(235,235,245,0.3)",
  accent: "#30D158",
  trained: "#FF453A",
  recovering: "#FF9F0A",
  almost: "#FFD60A",
  ready: "#3A3A3C",
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
export const radius = { chip: 12, card: 16, sheet: 24 } as const;
export const type = {
  large: { fontSize: 34, fontWeight: "700" as const },
  title: { fontSize: 22, fontWeight: "600" as const },
  body: { fontSize: 17, fontWeight: "400" as const },
  footnote: { fontSize: 13, fontWeight: "400" as const },
};
