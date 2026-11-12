import { useSyncExternalStore } from "react";
import { Alert, Linking, Platform } from "react-native";
import * as Device from "expo-device";
import Purchases, { type CustomerInfo } from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";
import { getMeta, setMeta } from "../storage/store";

/**
 * RevenueCat: the "default" offering sells musclepal_monthly and musclepal_lifetime. The only thing on sale
 * is Pro, so any active entitlement counts, whatever it is named in the dashboard.
 */
const ENTITLEMENT = "Muscle Pal Pro";
const CACHE_KEY = "pro_cached";
/** Public SDK keys (they ship inside the app). Apple keys start with appl_, Google keys with goog_. */
const keys = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || "appl_lpisreVJnuXpjLGQZCZYGvuzHvE",
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || "goog_qSLBwMEdMFTUxYDijpWIzzCgMIh",
};
const prefix = { ios: "appl_", android: "goog_" };
const apiKey = Platform.OS === "ios" || Platform.OS === "android" ? keys[Platform.OS] : "";
/** Store purchases need the store's own key and a real device. */
const available = !!apiKey && apiKey.startsWith(prefix[Platform.OS as "ios" | "android"]) && Device.isDevice;

type Plan = "Monthly" | "Lifetime" | "Pro";
interface ProState {
  purchased: boolean;
  plan: Plan | null;
  /** Development builds only: lets a simulator see the Pro app. */
  devPro: boolean;
}
let state: ProState = { purchased: false, plan: null, devPro: false };
const listeners = new Set<() => void>();
function set(next: Partial<ProState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function activeEntitlement(info: CustomerInfo) {
  return info.entitlements.active[ENTITLEMENT] ?? Object.values(info.entitlements.active)[0];
}

function apply(info: CustomerInfo) {
  const active = activeEntitlement(info);
  const id = active?.productIdentifier.toLowerCase() ?? "";
  const plan: Plan | null = !active ? null : id.includes("lifetime") ? "Lifetime" : id.includes("month") ? "Monthly" : "Pro";
  set({ purchased: !!active, plan });
  setMeta(CACHE_KEY, !!active);
}

let started = false;
/** Once at launch. The cached answer keeps Pro working offline. */
export async function startPro() {
  if (started) return;
  started = true;
  if (getMeta(CACHE_KEY) === true) set({ purchased: true, plan: "Pro" });
  if (!available || !apiKey) return;
  try {
    Purchases.configure({ apiKey });
    Purchases.addCustomerInfoUpdateListener(apply);
    apply(await Purchases.getCustomerInfo());
  } catch (error) {
    if (__DEV__) console.warn("[pro]", error);
  }
}

export function useIsPro() {
  return useSyncExternalStore(subscribe, () => state.purchased || state.devPro);
}
export function usePro() {
  return useSyncExternalStore(subscribe, () => state);
}
export function setDevPro(devPro: boolean) {
  if (__DEV__) set({ devPro });
}

function unavailable() {
  Alert.alert("Not available", "Purchases can't be made on this device right now.");
}

export async function showPaywall() {
  if (!available) return unavailable();
  try {
    await RevenueCatUI.presentPaywall({ displayCloseButton: true });
    apply(await Purchases.getCustomerInfo());
  } catch (error) {
    if (__DEV__) console.warn("[pro]", error);
  }
}

export async function restorePurchases() {
  if (!available) return unavailable();
  try {
    const info = await Purchases.restorePurchases();
    apply(info);
    const restored = !!activeEntitlement(info);
    Alert.alert(
      restored ? "Pro restored" : "Nothing to restore",
      restored
        ? "Thanks for supporting Muscle Pal."
        : "No Muscle Pal Pro purchase was found for this account.",
    );
  } catch {
    Alert.alert("Restore failed", "Please check your connection and try again.");
  }
}

export function manageSubscription() {
  void Linking.openURL(
    Platform.OS === "ios"
      ? "https://apps.apple.com/account/subscriptions"
      : "https://play.google.com/store/account/subscriptions?package=com.shadev.musclepal",
  ).catch(() => undefined);
}
