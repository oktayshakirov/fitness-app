import { router } from "expo-router";
import { ScrollView, Text, Pressable, View } from "react-native";
import { Screen, Heading, IconButton, Card, s } from "../../src/components/ui";
import { exercises, label } from "../../src/content";
import { colors } from "../../src/theme";
export default function Body() {
  const muscles = [...new Set(exercises.flatMap((e) => e.primary))];
  return (
    <Screen>
      <Heading
        title="Body"
        action={
          <IconButton
            name="settings-outline"
            label="Settings"
            onPress={() => router.push("/settings")}
          />
        }
      />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 0, gap: 20 }}
      >
        <Card>
          <Text style={s.title}>Make your next move.</Text>
          <Text style={[s.secondary, { marginTop: 8 }]}>
            Explore 30 exercises with clear 3D guides.
          </Text>
        </Card>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.navigate("/exercises")}
          style={{ paddingVertical: 14 }}
        >
          <Text style={[s.title, { color: colors.accent }]}>
            All exercises →
          </Text>
        </Pressable>
        <Text style={s.title}>Muscle groups</Text>
        {muscles.map((m) => (
          <Pressable
            key={m}
            accessibilityRole="button"
            onPress={() =>
              router.navigate({ pathname: "/exercises", params: { muscle: m } })
            }
          >
            <Card>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.text}>{label(m)}</Text>
                  <Text style={[s.footnote, { marginTop: 4 }]}>
                    {exercises
                      .filter((e) => e.primary.includes(m))
                      .slice(0, 2)
                      .map((e) => e.name)
                      .join(" · ")}
                  </Text>
                </View>
                <Text style={{ color: colors.accent }}>→</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
