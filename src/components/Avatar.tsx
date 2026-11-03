import { View } from "react-native";
import { Image } from "expo-image";
import { content } from "../content";
import type { Model } from "../content/types";
import { colors } from "../theme";
/** Round head-and-shoulders crop of the model's 2:3 hero render. */
export function Avatar({ model, size }: { model: Model; size: number }) {
  const hero = content.release.heroes[model];
  const width = size * 3;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        backgroundColor: colors.surface2,
        borderWidth: 2,
        borderColor: colors.accent,
      }}
    >
      {hero && (
        <Image
          source={content.resolve(hero)}
          contentFit="contain"
          style={{ position: "absolute", width, height: width * 1.5, left: (size - width) / 2 - 2, top: -size * 0.12 }}
        />
      )}
    </View>
  );
}
