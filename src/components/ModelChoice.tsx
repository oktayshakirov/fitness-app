import { View } from "react-native";
import { Text } from "./Text";
import { Image } from "expo-image";
import { Icon } from "./Icon";
import * as Haptics from "expo-haptics";
import { content, label } from "../content";
import type { Model } from "../content/types";
import { colors } from "../theme";
import { s } from "./ui";
import { PressableScale } from "./motion";
/** Two hero cards. `compact` crops to the upper body for Profile. */
export function ModelChoice({
  value,
  onChange,
  compact = false,
}: {
  value: Model;
  onChange: (model: Model) => void;
  compact?: boolean;
}) {
  return (
    <View style={[s.row, { alignItems: "stretch" }]}>
      {(["male", "female"] as const).map((model) => {
        const hero = content.release.heroes[model];
        const selected = model === value;
        return (
          <PressableScale
            key={model}
            accessibilityRole="radio"
            accessibilityLabel={`${label(model)} model`}
            accessibilityState={{ checked: selected }}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(model);
            }}
            scaleTo={0.97}
            style={{
              flex: 1,
              borderRadius: 24,
              borderWidth: 2,
              borderColor: selected ? colors.accent : colors.surface,
              backgroundColor: selected ? colors.accentDim : colors.surface,
              overflow: "hidden",
            }}
          >
            {hero ? (
              <Image
                source={content.resolve(hero)}
                contentFit={compact ? "cover" : "contain"}
                contentPosition="top"
                style={{
                  width: "100%",
                  aspectRatio: compact ? 1 : 2 / 3,
                  marginTop: compact ? 8 : 12,
                }}
              />
            ) : (
              <View style={{ height: 160, alignItems: "center", justifyContent: "center" }}>
                <Icon
                  name={model}
                  size={64}
                  color={selected ? colors.accent : colors.secondary}
                />
              </View>
            )}
            <View
              style={[
                s.row,
                { justifyContent: "center", gap: 6, paddingVertical: compact ? 10 : 14 },
              ]}
            >
              <Icon
                name={selected ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={selected ? colors.accent : colors.tertiary}
              />
              <Text style={s.headline}>{label(model)}</Text>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}
