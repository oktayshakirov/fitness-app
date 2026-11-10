import { ActionSheetIOS, Alert, Linking, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as MailComposer from "expo-mail-composer";
import * as StoreReview from "expo-store-review";

const APP_NAME = "Muscle Pal";
const CONTACT_EMAIL = "muscle-pal@oktayshakirov.com";
const ANDROID_PACKAGE = "com.shadev.musclepal";
/** Fill these in once the store listing and accounts exist. Empty links show as "Soon". */
const APP_STORE_ID = "";
export const TIKTOK_URL = "";
export const YOUTUBE_URL = "";

const appVersion = Constants.expoConfig?.version ?? "unknown";

function openMailto(subject: string, body: string) {
  return Linking.openURL(
    `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  );
}

/** Last resort when no mail app exists: let the user copy our address. */
function offerCopyAddress() {
  Alert.alert("No email app found", `Copy our address and send your message from any email app:\n\n${CONTACT_EMAIL}`, [
    { text: "Cancel", style: "cancel" },
    { text: "Copy address", onPress: () => void Clipboard.setStringAsync(CONTACT_EMAIL) },
  ]);
}

interface MailApp {
  name: string;
  open: () => Promise<unknown>;
}

async function canOpen(url: string) {
  try {
    return await Linking.canOpenURL(url);
  } catch {
    return false;
  }
}

async function sendMail(subject: string, body: string) {
  // Android's own chooser already lists every mail app.
  if (Platform.OS !== "ios") {
    await openMailto(subject, body).catch(offerCopyAddress);
    return;
  }
  const query = `to=${CONTACT_EMAIL}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const gmail = `googlegmail:///co?${query}`;
  const outlook = `ms-outlook://compose?${query}`;
  const apps: MailApp[] = [];
  if (await canOpen(gmail)) apps.push({ name: "Gmail", open: () => Linking.openURL(gmail) });
  if (await canOpen(outlook)) apps.push({ name: "Outlook", open: () => Linking.openURL(outlook) });
  if (await MailComposer.isAvailableAsync().catch(() => false))
    apps.push({
      name: "Apple Mail",
      open: () => MailComposer.composeAsync({ recipients: [CONTACT_EMAIL], subject, body }),
    });
  const [first] = apps;
  if (!first) {
    await openMailto(subject, body).catch(offerCopyAddress);
  } else if (apps.length === 1) {
    await first.open();
  } else {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: "Send with",
        options: [...apps.map((a) => a.name), "Cancel"],
        cancelButtonIndex: apps.length,
      },
      (index) => {
        void apps[index]?.open().catch(offerCopyAddress);
      },
    );
  }
}

export function reportBug() {
  const device = Device.modelName ?? "Unknown device";
  const os = `${Device.osName ?? Platform.OS} ${Device.osVersion ?? ""}`.trim();
  void sendMail(
    `[Bug Report] ${APP_NAME}`,
    `Describe the bug:\n\n\nSteps to reproduce:\n1.\n2.\n3.\n\n--- App info ---\nVersion: ${appVersion}\nDevice: ${device}\nOS: ${os}\n`,
  );
}

export function suggestFeature() {
  void sendMail(`[Feature Request] ${APP_NAME}`, "What feature would you like to see?\n\n\nWhy would this be useful?\n\n");
}

export function workWithUs() {
  void sendMail(
    `[Partnership] ${APP_NAME}`,
    `Hi ${APP_NAME} team,\n\nI'd like to explore a partnership opportunity.\n\nCompany / Name:\nWebsite:\nProposal:\n`,
  );
}

function storeListing() {
  if (Platform.OS === "android") return `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
  return APP_STORE_ID ? `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review` : null;
}

export async function rateApp() {
  if (await StoreReview.isAvailableAsync().catch(() => false)) {
    await StoreReview.requestReview().catch(() => undefined);
    return;
  }
  const url = storeListing();
  if (url) void Linking.openURL(url).catch(() => undefined);
}

export function openLink(url: string) {
  void Linking.openURL(url).catch(() => undefined);
}
