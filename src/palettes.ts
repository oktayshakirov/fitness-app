/** Colour tokens for both schemes. No React Native imports, so node tests can read them. */
export type Scheme = "dark" | "light";

const dark = {
  bg: "#0B0B0C",
  surface: "#1A1A1C",
  surface2: "#252528",
  surface3: "#323236",
  separator: "rgba(255,255,255,0.08)",
  text: "#FFFFFF",
  secondary: "rgba(235,235,245,0.62)",
  tertiary: "rgba(235,235,245,0.32)",
  /** Lime fills: buttons, selection, the recovery card. Text on them is `onAccent`. */
  accent: "#C8FA3C",
  /** Lime as text or an icon on a plain surface; darker in light mode so it stays readable. */
  accentInk: "#C8FA3C",
  onAccent: "#0B0B0C",
  accentDim: "rgba(200,250,60,0.14)",
  trained: "#FF4D3D",
  recovering: "#FF9F0A",
  almost: "#FFD60A",
  ready: "#C8FA3C",
  /** Icon drawn on a recovery-state colour. */
  onState: "#0B0B0C",
  chartPast: "#6E6E73",
  chartPastSelected: "#A1A1A6",
};
export type Palette = { [K in keyof typeof dark]: string };

const light: Palette = {
  bg: "#F2F2F7",
  surface: "#FFFFFF",
  surface2: "#EBEBF0",
  surface3: "#DCDCE3",
  separator: "rgba(0,0,0,0.08)",
  text: "#0B0B0C",
  secondary: "rgba(60,60,67,0.80)",
  tertiary: "rgba(60,60,67,0.30)",
  accent: "#C8FA3C",
  accentInk: "#406300",
  onAccent: "#0B0B0C",
  accentDim: "rgba(110,170,0,0.16)",
  trained: "#C8261B",
  recovering: "#A64B00",
  almost: "#7F6000",
  ready: "#406300",
  onState: "#FFFFFF",
  chartPast: "#8E8E93",
  chartPastSelected: "#48484A",
};
export const palettes: Record<Scheme, Palette> = { dark, light };

/**
 * The colours of the active scheme. Changed in place by `setScheme` in theme.ts, so `colors.text`
 * keeps working everywhere; screens call `useScheme()` so they re-render when it changes.
 */
export const colors: Palette = { ...dark };
