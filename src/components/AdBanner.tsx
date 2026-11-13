import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { bannerUnitId, startAds, useAds } from "../ads/ads";
import { useIsPro } from "../pro/pro";

/** A failed request (no fill, offline) is tried again after this long while the screen is open. */
const RETRY_MS = 60_000;

/**
 * Free tier only: a 320x50 banner at the top of the screens that show ads, in the page flow so
 * nothing overlaps it and the floating tab bar stays clear. It takes no space until an ad has
 * actually loaded, so a slow or unfilled request never leaves an empty gap above the heading.
 */
export function AdBanner() {
  const isPro = useIsPro();
  const { ready, nonPersonalized } = useAds();
  const show = !isPro && !!bannerUnitId;
  const [loaded, setLoaded] = useState(false);
  // Bumping the key remounts the banner, which sends a fresh request.
  const [attempt, setAttempt] = useState(0);
  const retry = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (show) void startAds();
  }, [show]);
  useEffect(() => () => clearTimeout(retry.current), []);
  if (!show || !ready || !bannerUnitId) return null;
  return (
    // The native view is 0x0 until an ad arrives, so the wrapper collapses on its own; the margin
    // only appears with the ad.
    <View key={attempt} style={{ alignItems: "center", marginTop: loaded ? 4 : 0 }}>
      <BannerAd
        unitId={bannerUnitId}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: nonPersonalized }}
        onAdLoaded={() => setLoaded(true)}
        onAdFailedToLoad={(error) => {
          if (__DEV__) console.warn("[ads] banner", error.message);
          // A failed refresh keeps showing the last ad; only an empty slot needs a new request.
          if (loaded) return;
          clearTimeout(retry.current);
          retry.current = setTimeout(() => setAttempt((n) => n + 1), RETRY_MS);
        }}
      />
    </View>
  );
}
