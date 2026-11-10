import { useEffect } from "react";
import { View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { bannerUnitId, startAds, useAds } from "../ads/ads";
import { useIsPro } from "../pro/pro";

/**
 * Free tier only: a 320x50 banner at the top of the screens that show ads, in the page flow so
 * nothing overlaps it and the floating tab bar stays clear.
 */
export function AdBanner() {
  const isPro = useIsPro();
  const { ready, nonPersonalized } = useAds();
  const show = !isPro && !!bannerUnitId;
  useEffect(() => {
    if (show) void startAds();
  }, [show]);
  if (!show || !ready || !bannerUnitId) return null;
  return (
    <View style={{ height: 50, alignItems: "center", marginTop: 4 }}>
      <BannerAd
        unitId={bannerUnitId}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: nonPersonalized }}
        onAdFailedToLoad={(error) => {
          if (__DEV__) console.warn("[ads] banner", error.message);
        }}
      />
    </View>
  );
}
