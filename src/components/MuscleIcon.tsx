import { Image } from "expo-image";
import { View } from "react-native";
import type { IconName } from "./ui";
import { Icon } from "./Icon";
import type { Muscle } from "../content/types";
import { colors } from "../theme";

/** Generated from assets/ui/muscle-groups by scripts/make_brand_assets.swift. */
const muscleIcons: Record<Muscle, number> = {
  chest: require("../../assets/ui/muscles/chest.png"),
  shoulders: require("../../assets/ui/muscles/shoulders.png"),
  biceps: require("../../assets/ui/muscles/biceps.png"),
  triceps: require("../../assets/ui/muscles/triceps.png"),
  forearms: require("../../assets/ui/muscles/forearms.png"),
  abs: require("../../assets/ui/muscles/abs.png"),
  quadriceps: require("../../assets/ui/muscles/quadriceps.png"),
  hamstrings: require("../../assets/ui/muscles/hamstrings.png"),
  glutes: require("../../assets/ui/muscles/glutes.png"),
  calves: require("../../assets/ui/muscles/calves.png"),
  lats: require("../../assets/ui/muscles/lats.png"),
  traps: require("../../assets/ui/muscles/traps.png"),
  middle_back: require("../../assets/ui/muscles/middle_back.png"),
  lower_back: require("../../assets/ui/muscles/lower_back.png"),
  adductors: require("../../assets/ui/muscles/adductors.png"),
  abductors: require("../../assets/ui/muscles/abductors.png"),
  neck: require("../../assets/ui/muscles/neck.png"),
};

/** Decorative: the row or button around it carries the spoken name. */
export function MuscleIcon({
  muscle,
  size = 48,
  badge,
  ring = colors.surface,
}: {
  muscle: Muscle;
  size?: number;
  /** A corner marker: recovery state, or primary/secondary. */
  badge?: { color: string; icon?: IconName };
  /** Colour behind the badge, so it stands off the artwork. */
  ring?: string;
}) {
  const badgeSize = badge?.icon ? Math.round(size * 0.36) : Math.round(size * 0.3);
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={muscleIcons[muscle]}
        contentFit="contain"
        accessible={false}
        style={{ width: size, height: size }}
      />
      {badge && (
        <View
          style={{
            position: "absolute",
            right: -3,
            bottom: -3,
            width: badgeSize + 4,
            height: badgeSize + 4,
            borderRadius: (badgeSize + 4) / 2,
            backgroundColor: ring,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: badge.color,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {badge.icon && <Icon name={badge.icon} size={Math.round(badgeSize * 0.68)} color={colors.onAccent} />}
          </View>
        </View>
      )}
    </View>
  );
}
