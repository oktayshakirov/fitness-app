import { Tabs } from "expo-router/js-tabs";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";
import { colors, fonts } from "../../src/theme";
const tabs = [
  { name: "index", title: "Home", icon: "home", sf: "house", sfActive: "house.fill" },
  { name: "exercises", title: "Exercises", icon: "barbell", sf: "dumbbell", sfActive: "dumbbell.fill" },
  { name: "history", title: "History", icon: "calendar", sf: "calendar", sfActive: "calendar.circle.fill" },
  { name: "settings", title: "Settings", icon: "settings", sf: "gearshape", sfActive: "gearshape.fill" },
] as const;
function TabIcon({ tab, focused }: { tab: (typeof tabs)[number]; focused: boolean }) {
  const color = focused ? colors.onAccent : colors.secondary;
  return (
    <View
      style={{
        width: 52,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? colors.accent : "transparent",
      }}
    >
      {Platform.OS === "ios" ? (
        <SymbolView
          name={focused ? tab.sfActive : tab.sf}
          tintColor={color}
          style={{ width: 22, height: 22 }}
        />
      ) : (
        <Ionicons name={focused ? tab.icon : `${tab.icon}-outline`} size={21} color={color} />
      )}
    </View>
  );
}
/** Floating pill tab bar; screens reserve `tabBarSpace` at the bottom. */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.secondary,
        tabBarLabelStyle: { fontFamily: fonts["500"], fontSize: 11, marginTop: 4 },
        tabBarStyle: {
          position: "absolute",
          marginHorizontal: 16,
          bottom: Math.max(insets.bottom, 12),
          height: 70,
          paddingTop: 9,
          paddingBottom: 9,
          borderRadius: 35,
          borderTopWidth: 0,
          backgroundColor: "transparent",
          elevation: 0,
          overflow: "hidden",
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              tint="systemChromeMaterialDark"
              intensity={80}
              style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(26,26,28,0.7)" }]}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.separator, borderRadius: 35 },
              ]}
            />
          ),
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => <TabIcon tab={tab} focused={focused} />,
          }}
        />
      ))}
    </Tabs>
  );
}
