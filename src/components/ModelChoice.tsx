import { Pressable, View } from "react-native";
import { Text } from "./Text";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { content, label } from "../content";
import type { Model } from "../content/types";
import { colors } from "../theme";
import { s } from "./ui";
/** Two hero cards. `compact` crops to the upper body for Settings. */
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
          <Pressable
            key={model}
            accessibilityRole="radio"
            accessibilityLabel={`${label(model)} model`}
            accessibilityState={{ checked: selected }}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(model);
            }}
            style={({ pressed }) => ({
              flex: 1,
              borderRadius: 24,
              borderWidth: 2,
              borderColor: selected ? colors.accent : colors.surface,
              backgroundColor: selected ? colors.accentDim : colors.surface,
              overflow: "hidden",
              opacity: pressed ? 0.8 : 1,
            })}
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
                <Ionicons
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
              <Ionicons
                name={selected ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={selected ? colors.accent : colors.tertiary}
              />
              <Text style={s.headline}>{label(model)}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
