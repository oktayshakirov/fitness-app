# Decisions and next steps

## Confirmed by the user

- 2026-10-21: mobile-first Expo / React Native selected. Full browser version remains optional for later.

- The current 30 exercise animations are approved; revisions may follow later.
- Preserve a versioned approved release before starting the app.
- Create fitness-app and plan architecture now; implementation comes later.
- User will supply screenshots and specific features before UI/product scope is fixed.
- Prefer provider subdomains initially; a custom domain and full web version are undecided.
- 2026-10-22: MVP scope and architecture agreed — see [MVP.md](MVP.md) (body-map home,
  muscle lists + All, looping exercise screen with explanations, TikTok-style feed,
  remote content updates without app releases, web export from the same Expo code,
  Cloudflare Pages hosting). MVP.md wins where this file conflicts.
- 2026-10-24: scope extended — male/female models (onboarding choice), recovery body view
  (front/back), one-tap logging, calendar + history, 2-column exercise grid, dark
  Apple-Fitness-style UI, free with ads + Pro (no ads), no account/paywall. See MVP.md + DESIGN.md.

## Proposed, awaiting discussion

| Decision | Recommendation | When to revisit |
|---|---|---|
| Exercise visuals | Existing loops in a native video player | If interactive 3D becomes required |
| Content delivery | Bundled initial library, versioned remote releases later | After on-device playback/offline prototype |
| Data persistence | Local-first with a migration-friendly storage layer | Once accounts/sync requirements are known |
| Blog/web repository | Defer fitness-blog | When SEO, articles or browser product has confirmed scope |
| Domains | Provider URLs first | Branding, public launch or integration needs justify purchase |

## Discussion order

1. After screenshots arrive, identify the central job: exercise reference, guided
   workouts, workout logging, or a combination. Rank launch requirements versus later ideas.
2. Decide whether accounts/cross-device sync, offline workouts, paid access and user-
   created routines are needed at launch. These drive data and backend architecture.
3. Agree navigation, core journeys and a small first release. Then choose libraries,
   storage/backend and hosting based on those concrete requirements.

## Implementation sequence after approval

1. Requirements: map each reference screenshot to a desired behavior; avoid copying
   visual assets. Produce screen inventory, user journeys and MVP acceptance criteria.
2. Technical prototype: Expo scaffold, content adapter and a single exercise player;
   validate video looping, WebP/SVG rendering and attribution on iOS and Android.
3. Content foundation: import all approved exercises, IDs, filters and muscle maps;
   verify offline startup, loading/error states and app background/foreground behavior.
4. Product features: implement the agreed flows, local persistence and migrations;
   workout timers, if included, derive from timestamps rather than assuming background
   JavaScript ticks continue running.
5. Content operations: versioned hosting, incremental downloads, rollback and compatible
   schema handling. Test adding an exercise without changing app screens.
6. Distribution: device QA, accessibility, privacy/support material and appropriate
   store releases. Decide blog, full web app and custom domain independently.

No milestones imply a fixed date or approved feature scope. No app code, accounts,
subscriptions, hosting projects or blog repository should be created during this
planning checkpoint beyond the explicitly requested planning repository.

## 2026-10-24 — M1 foundation in progress

- Implemented Expo SDK 58 / TypeScript / Router foundation with development-client
  build profiles, dark design tokens, reusable controls, three tabs and Settings credits.
- Imported 30 approved v0.1.0 exercises, 88 H.264 videos and 88 WebP posters; archive,
  per-file checksums, reviewed catalog text and approval fingerprints checked.
- Typed model/view interface supports future female/dark and hosted releases. Actual
  back-camera views preserved; abdominals normalized to abs. Requests in MVP.md.
- Bundle tests pass (2); TypeScript passes. Earlier Android and iOS native builds
  succeeded, but simulator UI acceptance is still pending following usage interruption
  and restart. Rebuilding both. Do not mark M1 complete or claim 60 fps yet.
- M2–M8 remain pending. No rendering repo edits, accounts, services or publishing.

## 2026-10-25 — Resume with lower-overhead validation

- Reused successful iOS/Android development binaries instead of recompiling. Metro
  must use IPv4 locally (`NODE_OPTIONS=--dns-result-order=ipv4first npm start -- --localhost`)
  because default localhost resolved to IPv6 and refused simulator IPv4 requests.
- M2 implemented: FlashList two-column poster grid, combined muscle/equipment/search
  filters, empty/reset states, detail with approved instructions, all actual camera
  views, previous/next buttons and video-surface swipe navigation. One player with
  serialized async source changes, first-frame poster cover, background/blur/offscreen
  pause, retry, and next-exercise asset prefetch without a second decoder.
- Four unit checks pass (bundle integrity + filter behavior); TypeScript checked.
  iOS Body and Exercises rendered; Android Exercises rendered behind its first-run
  development menu, with no ReactNativeJS/AndroidRuntime errors. This is smoke evidence,
  not completed interaction/performance acceptance. Screenshots currently in chat work/qa.
- Desktop UI inspection is unreliable: intermittent noWindowsAvailable and clicks that
  do not reach controls. Asked Oktay about Maestro for repeatable native tests. M1/M2
  acceptance remains open; no 60 fps, offline cold-start or lifecycle test claims yet.
- Next: native interaction checks, then M3 tracking/storage with migration tests, M4
  recovery tests/body assets, M5 settings, M6 remote content, gated M7, M8 release prep.

## 2026-10-25 — Tracking foundation and native test recovery

- Added transactional SQLite migrations, immutable exercise/muscle snapshots in logs,
  validated optional sets and local-date calendar/streak calculations. Ten unit checks
  pass, including failed-migration rollback, repeat launch and newer-schema rejection.
- Changed test runner to `node --import tsx --test` to avoid an unnecessary IPC server.
- Maestro is approved and installed. M1/M2 library flow passed on iOS 26.5 iPhone 17 Pro
  and Android API 36 Dev_Phone: search/reset/equipment filtering, detail navigation,
  camera switch, pause/play controls, previous/next, empty History and credits.
- Native swipe testing found ScrollView stealing video pans. Replaced PanResponder
  with coordinated native gestures; Android up/down/right and foreground restoration
  now pass. iOS gesture retest and M3 persistence flow are in progress.
- Content handoff adds appearance/transparency decisions in MVP.md. Only immutable
  v0.1.0 is currently published locally; do not import unapproved in-progress renders.
- No performance or packaged offline acceptance claim yet. M4–M8 remain pending.
