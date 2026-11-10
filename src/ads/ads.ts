import { useSyncExternalStore } from "react";
import { Platform } from "react-native";
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import mobileAds, { AdsConsent, AdsConsentStatus, TestIds } from "react-native-google-mobile-ads";

/** Fill in from AdMob. Until then release builds show no ads; development builds use Google's test ads. */
const productionBanner = Platform.select({ ios: "", android: "" });
export const bannerUnitId = __DEV__ ? TestIds.BANNER : productionBanner || null;

interface AdState {
  ready: boolean;
  nonPersonalized: boolean;
  /** EU/UK users must be able to reopen their consent choices. */
  privacyOptions: boolean;
}
let state: AdState = { ready: false, nonPersonalized: true, privacyOptions: false };
const listeners = new Set<() => void>();
function set(next: Partial<AdState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}
export function useAds() {
  return useSyncExternalStore(subscribe, () => state);
}
async function askTracking() {
  if (Platform.OS !== "ios") return;
  const { status } = await getTrackingPermissionsAsync();
  if (status === "undetermined") await requestTrackingPermissionsAsync();
}

let started = false;
/**
 * Runs the first time a free user reaches a screen with a banner, not at launch or in onboarding.
 * Order follows Google's guidance: EU consent form, then Apple's tracking prompt, then the SDK.
 */
export async function startAds() {
  if (started) return;
  started = true;
  let canRequestAds = true;
  let nonPersonalized = true;
  let privacyOptions = false;
  try {
    const info = await AdsConsent.gatherConsent();
    canRequestAds = info.canRequestAds;
    privacyOptions = info.privacyOptionsRequirementStatus === "REQUIRED";
    nonPersonalized =
      info.status === AdsConsentStatus.NOT_REQUIRED ? false : !(await AdsConsent.getUserChoices()).selectPersonalisedAds;
  } catch (error) {
    // No consent message published yet, or offline: serve only non-personalized ads.
    if (__DEV__) console.warn("[ads] consent", error);
  }
  try {
    await askTracking();
    if (canRequestAds) {
      await mobileAds().initialize();
      set({ ready: true, nonPersonalized, privacyOptions });
    }
  } catch (error) {
    if (__DEV__) console.warn("[ads]", error);
  }
}

export function openAdPrivacyOptions() {
  void AdsConsent.showPrivacyOptionsForm().catch(() => undefined);
}
