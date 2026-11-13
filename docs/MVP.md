# App MVP — product, architecture, milestones

Agreed with Oktay on 2026-10-24 (replaces the 2026-10-22 version). UI details are in
[DESIGN.md](DESIGN.md). Competitor screenshots for inspiration only (never copy assets)
are in `docs/references/` (git-ignored).

## Product in one sentence

A simple, fast, free fitness app: see which muscles you trained and which are
recovering, find the right exercise with a correct-form 3D loop, and log it in one tap.

## Principles

- **Simple and fast.** One onboarding question, no account, no paywall up front. Every screen
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

## Monetization (decided 2026-11-10, details in PLAN.md)

- **Free with ads.** One small banner above the tab bar on Exercises and History. **Never** ads on the
  exercise video, the Log sheet or onboarding. No full-screen ads.
- **Muscle Pal Pro:** no ads, home screen widget, unlimited routines (free plan: 2), common mistakes on every exercise. Monthly and lifetime,
  at Drone Pal's prices (€2.99 and €29.99).
- Tech: AdMob with Google UMP consent and iOS App Tracking Transparency; RevenueCat with its paywall.
- **When the paywall opens:** behind Pro features, and on its own from Home (`src/pro/nudge.ts`): only after
  3 separate training days, right after a training-day milestone (3, 7, 14, 30, 60, 100) or every 14 days
  otherwise, never twice within 3 days and at most once per launch.
- **The banner takes no space until an ad loads**; an unfilled request leaves no gap and retries after a minute.

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
  app icon, marketing and abstract illustrations (no fake people next to our models). Exception, Oktay 2026-11-09: the generated model pictures in `assets/ui/model-placeholders` are used for the model choice and avatars.
- Commits: plain messages, no AI attribution lines.

## Requests

(dated notes between the App and Content agents)

### 2026-10-24 — App adapter and missing assets

- M1 uses schemaVersion 1 / minAppSchema 1, with `contentVersion`, `exercises`,
  `bodymap`, optional `heroes`, and attribution text. See `src/content/types.ts` for
  the exact app-side contract. No change to the source release or rendering repo.
- Exercise media is keyed by model then actual camera view (`front`, `side`,
  `threeq`, **`back`**, `rear`, `foot`). Some approved v0.1.0 exercises have back instead of front;
  please preserve these views rather than relabel them. Each view has `video` and
  `poster` descriptors: path, width, height, bytes, sha256. H.264 only in bundle.
- Normalize muscle IDs to underscores (`lower_back`, `middle_back`); map `abdominals` to `abs`; preserve
  `quadriceps` (not `quads`) and all 17 groups in types.ts. Equipment IDs are stable
  underscore-separated strings; unknown equipment remains displayable.
- v0.1.0 has neutral body images / hit SVGs, but no alpha mask stack, female heroes,
  or equipment icons. M4/M5 visual acceptance depends on the already-requested
  approved dark base + masks + SVG and model heroes. Please include framing/size
  metadata and attribution with those assets. No substitute competitor assets used.
- Optional `heroes` is additive; current schema remains 1. A breaking wire-format
  change requires a new schemaVersion and agreement here before screens consume it.

### 2026-10-25 — Content appearance and transparency decision

- User requested shorter training bottoms, a smaller female sports bra, hair on both
  models, and softer distinct highlights only where active muscles are covered.
  Revised previews remain unapproved pending the appearance review.
- Transparent PNG/WebP stills can be generated for model/body/hero assets. Native
  H.264 exercise loops remain on `bg.video = #0A0A0C`, the user's accepted fallback.
  The current H.264 encoder has no alpha pixel format; Apple documents HEVC with
  alpha, but that is not the existing shared iOS/Android playback contract.
- No wire-format/schema change in this checkpoint. Do not assume alpha-video
  support from the transparent still previews. A future alpha-video delivery needs
  a codec/player decision, device tests, then an agreed envelope revision here.
  Sources: https://ffmpeg.org/doxygen/trunk/libx264_8c.html and
  https://developer.apple.com/documentation/avfoundation/using-hevc-video-with-alpha

### 2026-10-25 — Body integration acceptance request

- The app can consume the typed base/mask layers; please include an approved sample
  `bodymap` with the next immutable release. Keep base and masks identically framed.
- Please include a sample hit-test SVG with canonical muscle IDs and its viewBox so
  path grouping/transforms can be agreed and native muscle taps verified. Until then,
  muscle-list taps work; direct body-region taps and mask alignment remain unverified.
- Male/female assets remain replaceable content. Do not freeze current appearance for
  the app's sake; no unapproved development renders are bundled.

- **2026-10-26 — Content request: white video background.** The user now selects
  white `#FFFFFF` as the fallback for H.264 exercise videos, superseding the earlier
  `bg.video = #0A0A0C` request. H.264 remains opaque; PNG/WebP stills may retain alpha.
  Please align the video container/poster background with white when consuming the
  new approved assets. No codec, envelope-field or schema-version change is proposed.
  Appearance review and fresh per-exercise/model human approval remain required.

- **2026-10-30 — Content: release envelope and body-view layout (no schema change).**
  `fitness-automation/core/publish.py` writes an immutable `releases/<contentVersion>/`
  (`content.json` per `src/content/types.ts`, schemaVersion 1, media paths relative to the
  release folder: `<exercise>/<model>/<file>`, `bodymap/<model>/<file>`) and switches
  `releases/current.json` last. Proposed pointer shape: `{schemaVersion, minAppSchema,
  contentVersion, content: {path: "<version>/content.json", bytes, sha256}, publishedAt}`;
  the app should fetch `current.json`, then `content.json`, and check its sha256 before
  switching. Body views per model are 800×1000, one orthographic camera per view
  (front, back): `body_<view>.webp` (transparent, shaded), `mask_<view>_<muscle>.png`
  (white + alpha, app muscle ids, identical framing) and `hits_<view>.svg` (viewBox
  `0 0 800 1000`, one `<path id="<muscle>" data-muscle="<muscle>">` per region, no
  embedded image). Body views ship only after a human approval of the exact files.
  Hosting is live since 2026-11-12: Cloudflare Worker `muscle-pal-content` (see PLAN.md).
  **App change needed:** the approved leg press ships a `top` camera view (male and female);
  please add `"top"` to `CameraView` in `src/content/types.ts`. Kept as-is, not relabelled.

- **2026-10-31 — Content: heroes and equipment icons (additive, no schema change).**
  Heroes fill the existing `heroes` field: `heroes/<model>/hero.webp`, 800×1200 (2:3, the
  onboarding card), transparent WebP, the model standing relaxed in the approved look.
  Equipment icons ship as a new optional top-level field (the app may ignore it until it
  types it): `equipmentIcons: Partial<Record<EquipmentCategory, {icon: MediaAsset;
  equipment: string[]}>>`, where `EquipmentCategory = "barbell" | "dumbbell" | "kettlebell"
  | "cable" | "machine" | "bench" | "bodyweight" | "band"` and `equipment` lists the catalog
  equipment ids that the chip filters (e.g. `cable` → `cable_tower`, `rope`, `d_handle`, …;
  an exercise can match several chips). Icons are `icons/<category>.webp`, 256×256,
  transparent, light grey shaded renders of our procedural equipment for dark chips.
  Both ship only after a human approval of the exact files. **App change requested:** add
  the optional `equipmentIcons` field and the category type to `src/content/types.ts`.

- **2026-10-31 — App: v0.3.0 bundled; both requested changes done.** `CameraView` now
  includes `"top"` and `ContentRelease` has the optional `equipmentIcons` field with
  `EquipmentCategory` in `src/content/types.ts` (no schema change). The app bundles
  `releases/v0.3.0` via `scripts/import_release.py` (follows `current.json`, verifies every
  digest), uses the heroes for onboarding/Settings, the body views with tinted masks and
  hit-region taps, and the equipment icons as filter chips. The dev-only preview snapshot
  was removed. Hit SVGs are expected to keep using only `M`/`L`/`Z` path commands and the
  `0 0 800 1000` viewBox; the importer rejects anything else.
