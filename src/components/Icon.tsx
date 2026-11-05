import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
/**
 * Ionicons hidden from screen readers. Icons here are decorative (icon-only
 * buttons carry their own label); without this, VoiceOver reads the font glyph
 * as part of the parent's label ("Log this exercise, ").
 */
export function Icon(props: ComponentProps<typeof Ionicons>) {
  return (
    <Ionicons
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      {...props}
    />
  );
}
