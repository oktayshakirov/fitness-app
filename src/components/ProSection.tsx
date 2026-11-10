import { Switch, View } from "react-native";
import { Text } from "./Text";
import { Icon } from "./Icon";
import { Button, Group, Row, SectionTitle, s } from "./ui";
import { manageSubscription, restorePurchases, setDevPro, showPaywall, usePro } from "../pro/pro";
import { openAdPrivacyOptions, useAds } from "../ads/ads";
import { routineLimits } from "../storage/routines";
import { colors } from "../theme";

const perks = ["No ads", "Home screen widget", "Unlimited routines"];

export function ProSection() {
  const { purchased, plan, devPro } = usePro();
  const { privacyOptions } = useAds();
  const isPro = purchased || devPro;
  return (
    <>
      <SectionTitle title="Muscle Pal Pro" />
      {!isPro && (
        <View style={[s.card, { gap: 14 }]}>
          <View style={{ gap: 8 }}>
            {perks.map((perk) => (
              <View key={perk} style={[s.row, { gap: 10 }]}>
                <Icon name="checkmark-circle" size={20} color={colors.accent} />
                <Text style={s.text}>{perk}</Text>
              </View>
            ))}
          </View>
          <Text style={s.footnote}>The free plan includes {routineLimits.freeRoutines} routines.</Text>
          <Button title="Upgrade to Pro" arrow onPress={() => void showPaywall()} />
        </View>
      )}
      <Group>
        {isPro && <Row title="Your plan" icon="diamond-outline" value={plan ?? "Pro"} />}
        {plan === "Monthly" && <Row title="Manage subscription" icon="card-outline" onPress={manageSubscription} />}
        {!purchased && <Row title="Restore purchases" icon="refresh" onPress={() => void restorePurchases()} />}
        {privacyOptions && !isPro && (
          <Row title="Ad privacy choices" icon="shield-checkmark-outline" onPress={openAdPrivacyOptions} />
        )}
        {__DEV__ && (
          <Row title="Pro plan (dev)" icon="construct-outline">
            <Switch
              accessibilityLabel="Pro plan for development"
              value={devPro}
              onValueChange={setDevPro}
              trackColor={{ true: colors.accent, false: colors.surface3 }}
              thumbColor={colors.text}
              ios_backgroundColor={colors.surface3}
            />
          </Row>
        )}
      </Group>
    </>
  );
}
