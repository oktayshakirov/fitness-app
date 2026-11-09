import { View } from "react-native";
import { Text } from "./Text";
import { Image } from "expo-image";
import { Icon } from "./Icon";
import * as Haptics from "expo-haptics";
import { label } from "../content";
import type { Model } from "../content/types";
import { colors } from "../theme";
import { s } from "./ui";
import { PressableScale } from "./motion";
import { modelImages } from "./modelImages";
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
            <Image
              source={modelImages[model].body}
              contentFit={compact ? "cover" : "contain"}
              contentPosition="top"
              accessible={false}
              style={{
                width: "100%",
                aspectRatio: compact ? 1 : 2 / 3,
                marginTop: compact ? 8 : 12,
              }}
            />
            <View
              style={[
                s.row,
                { justifyContent: "center", gap: 6, paddingVertical: compact ? 10 : 14 },
              ]}
            >
              <Icon
                name={selected ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={selected ? colors.accent : colors.secondary}
              />
              <Text style={s.headline}>{label(model)}</Text>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}
