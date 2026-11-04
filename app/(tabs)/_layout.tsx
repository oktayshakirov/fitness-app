import { useRef } from "react";
import { useSegments } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";
import Animated, { useAnimatedStyle, useReducedMotion, withSpring } from "react-native-reanimated";
import { colors, fonts } from "../../src/theme";
import { settle } from "../../src/components/motion";
const tabs = [
  { name: "index", title: "Home", icon: "home", sf: "house", sfActive: "house.fill" },
  { name: "exercises", title: "Exercises", icon: "barbell", sf: "dumbbell", sfActive: "dumbbell.fill" },
  { name: "history", title: "History", icon: "calendar", sf: "calendar", sfActive: "calendar.circle.fill" },
  { name: "profile", title: "Profile", icon: "person", sf: "person", sfActive: "person.fill" },
] as const;
/**
 * The tab bar renders a focused and an unfocused copy of every icon and swaps
 * them instantly, so `focused` never changes for one copy. `active` is the real
 * selection: when it turns on, the focused copy's lime pill springs from 60 %.
 * Opacity stays 1 so the dark active glyph is never left on the dark bar.
 */
function TabIcon({ tab, focused, active }: { tab: (typeof tabs)[number]; focused: boolean; active: boolean }) {
  const color = focused ? colors.onAccent : colors.secondary;
  const pill = useAnimatedStyle(() => ({ transform: [{ scale: withSpring(active ? 1 : 0.6, settle) }] }));
  return (
    <View style={{ width: 52, height: 32, alignItems: "center", justifyContent: "center" }}>
      {focused && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: 16, backgroundColor: colors.accent }, pill]}
        />
      )}
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
  const reduced = useReducedMotion();
  // Current tab from the route ("index" is omitted from segments); kept while a stacked
  // screen such as an exercise is open, so returning does not replay the pill.
  const segments = useSegments() as string[];
  const lastTab = useRef("index");
  if (segments[0] === "(tabs)") lastTab.current = segments[1] ?? "index";
  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        // 150 ms native-driver cross-fade between tabs; off with Reduce Motion.
        animation: reduced ? "none" : "fade",
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
            tabBarIcon: ({ focused }) => <TabIcon tab={tab} focused={focused} active={lastTab.current === tab.name} />,
          }}
        />
      ))}
    </Tabs>
  );
}
