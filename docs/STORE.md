# Store listing and release checklist (M8)

Drafts for App Store Connect and Google Play. Nothing here has been submitted; no store
accounts or listings exist yet (MVP rule: no accounts or submissions without Oktay's go-ahead).

## Decisions Oktay still has to make

- **Store name: Muscle Pal** (chosen 2026-11-09). On 2026-11-07 no app with this name was on the
  App Store (US, DE) or Google Play. Risk: musclepal.app was registered in March 2026 and shows
  "Launching Soon", and musclepal.com is parked, so someone may launch under this name first.
  Neither store reserves a name until an app record exists. No trademark search has been done.
- **Bundle ID** is still `com.oktayshakirov.fitness` and cannot change after the first
  submission. Changing it now means a fresh install on test devices.
- **Contact email** for the listing and the privacy page (`public/privacy-policy.html` has a TODO).
- **Privacy page host.** The page is a single static file; it ships in the web export at
  `/privacy-policy.html`, or can go on any existing site. Stores need its public URL.
- **Icon:** the chest logo in `assets/brand/chest-identity`. `swift scripts/make_brand_assets.swift`
  builds the app icon, Android layers, splash and favicon from it.
- **Pricing** follows M7 (free with optional Pro, or paid). Until then the listing says free.

## Listing copy (draft)

- **Subtitle (iOS, 30):** Exercise form & muscle recovery
- **Short description (Play, 80):** See every exercise from every angle, log sets and know which muscles are ready.
- **Category:** Health & Fitness. **Age rating:** 4+ / Everyone (no user content, no web views, no purchases yet).
- **Keywords (iOS, 100):** workout,gym,exercise,form,technique,muscle,recovery,log,tracker,strength,training,routine

**Description**

Learn every exercise with correct form, then track what you did.

- 3D exercise videos from several camera angles, with the working muscles highlighted
- A male or female model, your choice
- Body map that shows which muscles are trained, recovering or ready
- Log sets, reps and weight in seconds; edit any day in History
- Routines, personal records, a progress chart and a weekly goal
- Plate calculator and rest timer
- Works offline. No account, no ads, no tracking: your logs stay on your phone
- Export and import your data as a plain file

## Privacy answers

Correct for the current build (no analytics, ads or purchases). Revisit for M7.

- **App Store, App Privacy:** Data Not Collected. Tracking: No.
- **Google Play, Data safety:** no data collected, no data shared. Data is encrypted in
  transit: yes (HTTPS content host required). Users can request deletion: data is local;
  in-app erase and uninstall delete it.
- **Export compliance:** `ITSAppUsesNonExemptEncryption = false` (only HTTPS via the OS).
- **Android permissions in the release build** (checked on the emulator 2026-11-05): INTERNET,
  VIBRATE, ACCESS_NETWORK_STATE and WAKE_LOCK (normal, install-time, added by libraries).
  `app.json` blocks SYSTEM_ALERT_WINDOW and the legacy storage permissions prebuild adds.

## Screenshots

Required sizes: iOS 6.9" (1320×2868, iPhone 17 Pro Max simulator) is enough for all
iPhones; Play needs 2-8 phone shots (1080×1920 or larger, 9:16). iPad is enabled
(`supportsTablet`); either add 13" iPad shots or turn tablet support off before submitting.

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
- [x] Privacy policy page (`public/privacy-policy.html`), in-app Privacy screen
- [x] Unneeded Android permissions removed
- [x] Store name: Muscle Pal
- [ ] Contact email, privacy URL (Oktay)
- [ ] Screenshots from a release build
- [x] Contrast: every text token passes WCAG AA on every surface (`tests/contrast.test.ts`)
- [x] Release builds start offline on the iOS simulator and Android emulator (bundled JS + content)
- [x] iOS largest standard text size (XXXL): onboarding, Home, Exercises, exercise detail, Profile
- [ ] Accessibility by ear: VoiceOver/TalkBack walk-through; accessibility text sizes (AX1-AX5)
- [ ] Performance: 60 fps grid scroll and video start on a mid-range Android phone (physical)
- [ ] Web export of the library
- [ ] `version` / build numbers set for the first submission; EAS project (needs account)
