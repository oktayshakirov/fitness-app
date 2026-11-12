# Store listing and release checklist (M8)

Drafts for App Store Connect and Google Play. Nothing here has been submitted; no store
accounts or listings exist yet (MVP rule: no accounts or submissions without Oktay's go-ahead).

## Decisions Oktay still has to make

- **Store name: Muscle Pal** (chosen 2026-11-09). On 2026-11-07 no app with this name was on the
  App Store (US, DE) or Google Play. Risk: musclepal.app was registered in March 2026 and shows
  "Launching Soon", and musclepal.com is parked, so someone may launch under this name first.
  Neither store reserves a name until an app record exists. No trademark search has been done.
- **Bundle ID:** `com.shadev.musclepal`, on iOS and Android. It cannot change after the first submission.
  iOS extensions: `.widget`, `.watch` and `.watch.widget` (the complication). Apple refused
  `.watch.complication` as "not available", so don't go back to it. Apple has no public lookup for IDs:
  registering is the only check, and Xcode does that when it signs with automatic signing.
- **Contact email:** muscle-pal@oktayshakirov.com.
- **Privacy page:** https://oktayshakirov.com/privacy-policy/muscle-pal.html, in the portfolio repo
  with the other apps. Update it before any version with ads or purchases ships.
- **Icon:** the chest logo in `assets/brand/chest-identity`. `swift scripts/make_brand_assets.swift`
  builds the app icon, Android layers, splash and favicon from it.
- **Pricing:** free with ads; Muscle Pal Pro at €2.99/month or €29.99 lifetime, matching Drone Pal. Set in App Store Connect and Play Console; the RevenueCat paywall reads them.

## Listing copy (draft)

- **Subtitle (iOS, 30):** Exercise form & muscle recovery
- **Short description (Play, 80):** See every exercise from every angle, log sets and know which muscles are ready.
- **Category:** Health & Fitness. **Age rating:** 4+ / Everyone (no user content, no web views). From 1.1 the questionnaires
  must say "contains ads" and "in-app purchases"; Play also asks for the ads declaration (Contains ads: Yes).
- **Developer website** in both stores: https://oktayshakirov.com, where `app-ads.txt` lists
  `pub-5852582960793521` (AdMob checks it there).
- **Subscription rules (App Store 3.1.2):** the paywall and the App Store description need working links to
  the Privacy Policy (https://oktayshakirov.com/privacy-policy/muscle-pal.html) and Terms of Use (Apple's
  standard EULA, https://www.apple.com/legal/internet-services/itunes/dev/stdeula/, unless a custom one is
  written). The paywall is edited in RevenueCat's dashboard.
- **Keywords (iOS, 100):** workout,gym,exercise,form,technique,muscle,recovery,log,tracker,strength,training,routine

**Description**

Learn every exercise with correct form, then track what you did.

- 3D exercise videos from several camera angles, with the working muscles highlighted
- A male or female model, your choice
- Body map that shows which muscles are trained, recovering or ready
- Log sets, reps and weight in seconds; edit any day in History
- Routines, personal records, a progress chart and a weekly goal
- Plate calculator and rest timer
- Works offline. No account: your logs stay on your phone
- Export and import your data as a plain file

## Privacy answers

Drafts for a build with AdMob and RevenueCat. Check them against each SDK's current data disclosure when filling in the forms.

- **App Store, App Privacy:** Identifiers (Device ID) and Usage Data (Advertising Data) for third-party advertising; Purchases (Purchase History) for app functionality. Tracking: Yes, behind the App Tracking Transparency prompt.
- **Google Play, Data safety:** Device or other IDs collected and shared for advertising; purchase history collected for app functionality. Data is encrypted in transit. Contains ads: Yes. Training data stays local; in-app erase and uninstall delete it.
- **Export compliance:** `ITSAppUsesNonExemptEncryption = false` (only HTTPS via the OS).
- **Android permissions:** INTERNET, VIBRATE, POST_NOTIFICATIONS and SCHEDULE_EXACT_ALARM (rest
  alert, both asked from the user), plus normal ones added by libraries (network state, wake lock,
  boot completed). Since 1.0.1 also `com.android.vending.BILLING`, which Play Console requires before
  it lets you create in-app products (no billing code ships yet). `app.json` blocks SYSTEM_ALERT_WINDOW and legacy storage. `expo-notifications`
  bundles the Firebase messaging library, but no Firebase project is configured and it stays unused.

## Screenshots

Required sizes: iOS 6.9" (1320×2868, iPhone 17 Pro Max simulator) is enough for all
iPhones; iPad 13" (2064×2752, iPad Pro 13-inch simulator) covers every iPad; the Apple Watch app
needs its own set (one size is enough, e.g. 416×496 from an Apple Watch Series 11 46mm simulator,
or the Ultra size). Play needs 2-8 phone shots (1080×1920 or larger, 9:16).

Planned set, captured from a release build with clean demo data:
1. Home: recovery card, week strip and body map
2. Exercise detail: video with highlighted muscles and the angle cards
3. Exercises grid filtered by a muscle
4. Log sheet with sets
5. History calendar with a day open
6. Progress chart and records
7. Onboarding model choice

## Release checklist

- [x] Icon, Android adaptive + themed icon, splash, favicon (`assets/brand`)
- [x] Privacy policy page (portfolio repo), in-app Privacy screen
- [x] Unneeded Android permissions removed
- [x] Store name: Muscle Pal
- [x] Contact email, privacy URL
- [ ] Screenshots from a release build: iPhone, iPad, Apple Watch, Android phone
- [x] iPad: layouts capped to a centred 720 pt column, all orientations (resizable windows)
- [x] Apple Watch app on a paired iPhone 17 Pro + Apple Watch Series 11 simulator: the summary arrives on launch
  and after each log (100% -> 53%, streak, resting list)
- [ ] Apple Watch: complications on a watch face, and a real paired watch
- [x] Contrast: every text token passes WCAG AA on every surface (`tests/contrast.test.ts`)
- [x] Release builds start offline on the iOS simulator and Android emulator (bundled JS + content)
- [x] iOS largest standard text size (XXXL): onboarding, Home, Exercises, exercise detail, Profile
- [ ] Accessibility by ear: VoiceOver/TalkBack walk-through; accessibility text sizes (AX1-AX5)
- [ ] Performance: 60 fps grid scroll and video start on a mid-range Android phone (physical)
- [ ] Web export of the library
- [x] Version 1.0.0, iOS build 1, Android versionCode 1
- [x] Version 1.0.1, iOS build 2, Android versionCode 2: adds the BILLING permission so Play Console
  allows in-app products
- [ ] Uploaded to Google Play and App Store Connect (Oktay, from 2026-11-10)
