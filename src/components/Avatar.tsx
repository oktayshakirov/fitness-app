import { View } from "react-native";
import { Image } from "expo-image";
import type { Model } from "../content/types";
import { colors } from "../theme";
import { modelImages } from "./modelImages";
/** Round portrait of the chosen model. */
export function Avatar({ model, size }: { model: Model; size: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        backgroundColor: colors.surface2,
        borderWidth: 2,
        borderColor: colors.accentInk,
      }}
    >
      <Image source={modelImages[model].profile} contentFit="cover" accessible={false} style={{ flex: 1 }} />
    </View>
  );
}
