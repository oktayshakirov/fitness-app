import { Tabs } from "expo-router/js-tabs";
import { Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Ionicons } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";
import { colors } from "../../src/theme";
function TabIcon({
  name,
  sf,
  color,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  sf: React.ComponentProps<typeof SymbolView>["name"];
  color: string;
}) {
  return Platform.OS === "ios" ? (
    <SymbolView name={sf} tintColor={color} style={{ width: 24, height: 24 }} />
  ) : (
    <Ionicons
      name={name}
      size={24}
      color={typeof color === "string" ? color : colors.secondary}
    />
  );
}
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.secondary,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopColor: colors.separator,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" && isLiquidGlassAvailable() ? (
            <GlassView
              style={StyleSheet.absoluteFill}
              glassEffectStyle="regular"
            />
          ) : (
            <BlurView
              tint="dark"
              intensity={70}
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "#1C1C1EDD" },
              ]}
            />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Body",
          tabBarIcon: ({ color }) => (
            <TabIcon
              name="body-outline"
              sf="figure.stand"
              color={typeof color === "string" ? color : colors.secondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: "Exercises",
          tabBarIcon: ({ color }) => (
            <TabIcon
              name="barbell-outline"
              sf="dumbbell"
              color={typeof color === "string" ? color : colors.secondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => (
            <TabIcon
              name="calendar-outline"
              sf="calendar"
              color={typeof color === "string" ? color : colors.secondary}
            />
          ),
        }}
      />
    </Tabs>
  );
}
