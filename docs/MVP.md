# App MVP — product, architecture, milestones

Agreed with Oktay on 2026-10-24 (replaces the 2026-10-22 version). UI details are in
[DESIGN.md](DESIGN.md). Competitor screenshots for inspiration only (never copy assets)
are in `docs/references/` (git-ignored).

## Product in one sentence

A simple, fast, free fitness app: see which muscles you trained and which are
recovering, find the right exercise with a correct-form 3D loop, and log it in one tap.

## Principles

- **Simple and fast.** One onboarding question, no account, no paywall. Every screen
  reachable in ≤ 2 taps. Cold start to usable < 2 s; no spinners for local content.
- **Clean dark UI** in the spirit of Apple Fitness / Health (see DESIGN.md).
- **Correct form first.** Only approved exercises ship.
- **Everything is free.** Ads support the free tier; **Pro** removes ads (and later adds
  extras). No feature needed to train is ever locked.

## Users and flows

1. **Onboarding (once, ~5 s):** "Choose your model" — Male / Female cards (our own 3D
   renders). Optional second step: units (kg/lb). Done. Changeable in Settings.
2. **Home (Body):** the user's body model (front/back) coloured by recovery, with a
   vertical list of muscle groups below. Scrolling the list highlights the focused muscle
   on the body (and flips front/back when needed). Tap a muscle → its exercises.
3. **Exercises:** 2-column grid of exercise cards (poster, name, equipment), filtered by
   muscle (or All), equipment chips, search. Tap → exercise detail.
4. **Exercise detail:** full-width looping video (chosen model), view switcher
   (front/side/¾), muscles worked (primary/secondary), a big **"Log"** button, then
   steps, cues, common mistakes, breathing (collapsible). Swipe up/down = next/previous
   exercise in the current list.
5. **Log:** bottom sheet — defaults to "done" with one tap; optional sets × reps × weight
   (prefilled from the last time). Saving updates recovery, calendar and history instantly.
6. **History:** month calendar with active days (streaks: active days, weekly streak),
   tap a day → that day's logged exercises; list of recent sessions below. Edit/delete entries.
7. **Settings:** model, units, recovery speed (normal / fast / slow), Pro / restore
   purchase, privacy, credits (Z-Anatomy CC BY-SA, MPFB, free-exercise-db), content version.

Later / optional (not MVP): routines & programs, levels, workout timer, rest timer,
stats/charts, Apple Health / Health Connect export, iCloud backup/sync, reminders,
AI plan builder, widgets.

## Recovery model (simple, explainable, local)

- Each log entry fatigues its exercise's **primary muscles 100%** and **secondary 50%**
  (scaled down for "done" with no sets; sets × reps add up to a cap).
- Fatigue decays linearly over a recovery window per group: large (quads, hamstrings,
  glutes, lats, chest, lower back) 72 h; medium (shoulders, traps, middle back,
  adductors, abductors) 60 h; small (biceps, triceps, forearms, calves, abs, neck) 48 h.
  "Recovery speed" setting scales all windows ×0.75 / ×1.25.
- States for colour: **Trained** (fatigue > 66%), **Recovering** (33–66%), **Almost
  ready** (< 33%), **Ready** (0 or never trained). Show "ready in ~X h" per muscle.
- Pure function of the log → deterministic, testable, no backend. Show a one-line
  "estimates, not medical advice" note in the explainer.

## Architecture

- **Expo (latest stable SDK), TypeScript, Expo Router.** iOS + Android first; web export
  later from the same code (library + exercise pages only; no ads on web).
- **Development builds** (not Expo Go) because ads/IAP need native modules. EAS Build profiles: dev, preview, production.
- **Video:** `expo-video` on the detail screen only (loop, muted, poster underneath until
  first frame). Grid uses static WebP posters (no autoplay in grids). One player alive at a
  time (+ preload next on swipe). Pause on blur/background.
- **Lists:** `@shopify/flash-list`; images `expo-image` (memory+disk cache).
- **Body view:** pre-rendered 3D-shaded body image per model × view (front/back), plus
  one alpha mask PNG per muscle group per view, stacked with `expo-image`
  `tintColor` (state colour) and opacity — looks 3D, costs no GPU work, no 3D engine.
  Taps hit-tested with the traced SVG paths (invisible) from `bodymap/`.
  Real-time rotation (GLB + three.js) is out of scope unless the static version
  disappoints on devices.
- **Storage:** local-first. `expo-sqlite` for log entries (id, exerciseId, timestamp,
  sets JSON, note) with migrations; settings in a small key-value store. Export/import
  JSON as a safety net before any cloud backup exists.
- **Glass:** `expo-blur` for tab bar/sheets; on iOS 26 use the native liquid-glass tab bar /
  glass effect if available in the chosen SDK (verify; fall back to blur).
- **Haptics** (`expo-haptics`) on Log and toggles. Respect Reduce Motion.
- **Code updates:** EAS Update for JS changes; store builds only for native changes.

## Content (no app release needed for new/fixed exercises)

- Bundled release (offline first launch) + remote releases on static hosting
  (Cloudflare Pages `*.pages.dev`; Netlify fallback; not Vercel Hobby — non-commercial).
- `current.json` → `releases/<contentVersion>/content.json` (`schemaVersion`,
  `contentVersion`, `minAppSchema`, exercises with text/muscles/equipment and media per
  **model** (`male`/`female`) and view: path, size, bytes, sha256; `bodymap` per model;
  attribution). Publish order: upload → verify → switch `current.json` last.
- App: check on launch/foreground (throttled), download `content.json` + posters, videos
  lazily on first view (cached on disk, sha256-verified); atomic switch; keep last good
  release + bundled fallback; ignore unknown fields; never crash on a bad release.
- Until the Content agent's `publish.py` exists, read v0.1.0 through a typed adapter
  (male, light-background videos) so screens are built against the final interface.

### What the Content agent (fitness-automation) must deliver

1. **Dark-background renders**: background colour = DESIGN.md `bg.video` exactly, so videos
   blend into cards with no visible box. Re-render all approved exercises.
2. **Female model**: MPFB female body (same base mesh → same UVs → muscle masks reuse),
   same solver/specs, QA and approval per exercise. File naming adds the model.
3. **Clothing** for both models (MPFB CC0 clothes or simple procedural garments): minimal
   training shorts; sports top for female. Highlighted muscles must stay visible — if a
   garment covers a highlighted muscle, transfer the body UVs to the garment so it shows the
   same highlight. Keeps the app store/ad-network safe.
4. **Body view assets** per model: `body_<view>.webp` (dark, 3D-shaded, neutral pose,
   ~1000 px tall) + `mask_<view>_<group>.png` (alpha, same framing) for all 17 groups +
   hit-test SVG. Same camera for base and masks.
5. **Onboarding hero renders**: male and female, flattering light, transparent or bg colour.
6. **Equipment icons** rendered from our procedural equipment (barbell, dumbbell, kettlebell,
   cable, machine, bench, bodyweight, band) in one consistent style.
7. `core/publish.py` producing the envelope above (H.264 only in the app bundle).

## Monetization (decide details before M7; implement behind a flag)

- **Free with ads, nothing locked.** Placements that don't hurt the experience: one small
  banner at the bottom of the Exercises grid and History list. **Never** ads on the exercise
  video, the Log sheet or onboarding. Optional later: one interstitial at most once per
  day, only after a logged session; optional rewarded "ad-free for 24 h".
- **Pro** (no ads + later extras like routines, stats, backup): offer both a yearly
  subscription and a one-time lifetime purchase; price after looking at competitors.
- Tech: `react-native-google-mobile-ads` (AdMob) with Google UMP consent (required in the
  EU/UK) and iOS App Tracking Transparency; RevenueCat (`react-native-purchases`) for IAP.
  Accounts with AdMob/RevenueCat/stores are created only with Oktay's go-ahead.

## Milestones (each ends with a check on iPhone + Android; screenshots in the PR note)

- **M1 Foundation:** scaffold, design tokens + core components (DESIGN.md), tab layout,
  typed content adapter (v0.1.0 bundled), dev builds running.
- **M2 Library:** Exercises grid + filters + search, exercise detail with video, view
  switcher, swipe between exercises.
- **M3 Tracking:** log sheet, sqlite store + migrations, History calendar + day list + edit,
  streak numbers.
- **M4 Body home:** recovery engine (unit-tested), body view with tinted masks (front/back),
  muscle list with scroll-sync highlight, tap → filtered library.
- **M5 Onboarding + Settings:** model choice (switches videos + body), units, recovery
  speed, credits, export/import.
- **M6 Remote content:** update check, download/verify/activate, rollback; prove a new
  exercise appears without an app build.
- **M7 Monetization:** consent, banner placements, Pro purchase/restore (after Oktay
  confirms accounts and model).
- **M8 Release prep:** web export (library only), icon/splash, store screenshots, privacy
  page, accessibility pass, performance pass (60 fps scroll on a mid Android phone).

## Two agents

| Agent | Repo | Owns |
|---|---|---|
| **App** | `fitness-app` | everything in this file except "What the Content agent must deliver" |
| **Content** | `fitness-automation` | the 7 deliveries above, new exercises, later 9:16 social exports |

Contract = the content envelope + body view assets. Changes go into this file first
(add a dated note under "Requests") and bump `schemaVersion`.

## Rules

- Nothing unapproved ships; credits visible in Settings.
- No accounts, payments, ad networks, hosting projects or store submissions without Oktay's go-ahead.
- Images: our own renders for bodies and equipment; ChatGPT-generated images only for
  app icon, marketing and abstract illustrations (no fake people next to our models).
- Commits: plain messages, no AI attribution lines.

## Requests

(dated notes between the App and Content agents)
