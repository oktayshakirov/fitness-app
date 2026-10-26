import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { content, label } from "../content";
import type { Model } from "../content/types";
import { colors } from "../theme";
import { s } from "./ui";
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
        return (
          <Pressable
            key={model}
            accessibilityRole="radio"
            accessibilityLabel={`${label(model)} model`}
            accessibilityState={{ checked: model === value }}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(model);
            }}
            style={{
              flex: 1,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: value === model ? colors.accent : colors.surface2,
              backgroundColor: colors.video,
              padding: 12,
              alignItems: "center",
              gap: 12,
            }}
          >
            {!compact &&
              (hero ? (
                <Image
                  source={content.resolve(hero)}
                  contentFit="contain"
                  style={{ width: "100%", aspectRatio: 3 / 4 }}
                />
              ) : (
                <View style={{ height: 160, justifyContent: "center" }}>
                  <Ionicons
                    name={model === "male" ? "male" : "female"}
                    size={64}
                    color={value === model ? colors.accent : colors.secondary}
                  />
                </View>
              ))}
            <Text style={s.text}>{label(model)}</Text>
            {value === model && (
              <Ionicons
                name="checkmark-circle"
                color={colors.accent}
                size={20}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
