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

## 2026-10-25 — Saved tracking UI after another usage interruption

- M1/M2 functional native checks now pass on both platforms, including video-surface
  up/down/right gestures and background/foreground restoration. No 60 fps or packaged
  offline cold-start claim; those remain release acceptance work.
- M3 UI implemented: quick-log + Undo, log/edit sheet, reps/weight steppers, prefill,
  notes, last-log summary, calendar, thumbnails, swipe-to-delete and reversible deletion.
- Android passed typed edits (12 reps, 40 kg, note), process restart persistence,
  delete/Undo/delete. iOS passed quick-log/Undo, done logging, opening/editing entries;
  typed edit/persistence verification is still open after a stale XCTest runner stalled.
  The stale runner was stopped and the simulator restarted; resume only the remaining flow.
- Numeric fields select on focus. A Done editing control dismisses the keyboard;
  native scroll keyboard insets avoid nested keyboard-resize behavior in the sheet.
- Oktay confirmed there is no newer approved release yet. Male/female content exists
  in development and continues changing. Keep v0.1.0 bundled and the typed model contract.
- M4 recovery/body drafts are staged in the chat workspace under work/m3, not applied
  to the app yet. Finish M3's iOS check first. M5–M8 remain pending.

## 2026-10-25 — Native tracking checks and Body integration

- M3 workflow checked on both devices. Android: typed reps/weight/note, save, process
  restart, preserved values, delete/Undo/delete. iOS: quick-log/Undo, Done log, edit via
  steppers (12 reps, 5 kg), typed note, process restart, preserved values, delete/Undo/delete.
  Direct numeric typing on iOS remains a separate open verification item after XCTest
  stalled when switching numeric fields; do not claim that path was verified.
- Added stable IDs to log inputs: iOS combines the note label and placeholder into
  accessibility text, so the previous exact-text selector missed a visible field.
- Recovery engine committed with six additional tests (16 total pass). Done-only load
  is 0.5; 30 total reps reaches the per-entry cap. Rules are in docs/RECOVERY.md.
- Body now computes recovery from saved muscle snapshots, refreshes on focus/foreground,
  lists all 17 muscles and links to filtered exercises. Optional base/mask layers use
  the content contract with focused-row highlighting and Reduce Motion-aware fades.
- M4 is not complete: approved body images/masks and the hit-test SVG sample are still
  needed for alignment and direct-body taps. Added the acceptance request in MVP.md.
- No new content release imported; male/female appearances are still evolving. No
  rendering-repo edits, accounts, services, advertising or purchase setup.
- Body recovery-list checks passed on Android and iOS: Chest opens four matching
  exercises, quick-log updates Chest recovery, and the explainer opens correctly.
  iOS initially retained an old JS bundle; restarting the development app loaded the
  current Body screen. Restart after source changes rather than relying on Fast Refresh.
- Checkpoint: M1/M2 functional checks passed; M3 workflow checks passed with the iOS
  numeric-typing caveat above; M4 logic/list verified, body visual/tap acceptance pending
  approved content. M5–M8 are not complete. Continue with approved body integration,
  model/settings/export, remote releases, then gated monetization and release checks.

## 2026-10-26 — M5 onboarding, preferences and backups

- Added one-screen model/units onboarding, persisted model/units/recovery speed,
  local Privacy copy and credits/version information. Screens select media/body from
  preferences with approved-asset fallback; unapproved development content is not bundled.
- Fixed first launch selecting Privacy instead of onboarding by using explicit
  protected-route redirect destinations. Continue now opens Body on both platforms.
- Added transactional settings migration and JSON backup validation/import/export.
  Existing log IDs are preserved; logs and preferences import atomically. Invalid
  backups and failed writes leave existing data intact. 22 unit tests and typecheck pass.
- Both platforms passed onboarding, settings toggles, Privacy, importing a synthetic
  backup, JSON export/share-sheet presentation, and 40 kg -> 88.18 lb -> unchanged
  save -> 40 kg. Android repeat import passed (0 added, 1 existing entry preserved).
- Android restart UI checks passed. iOS restart retained female/lb/slow and onboarding
  in SQLite; Maestro exposes the checked radio as text instead of its checked flag,
  so the shared test now limits that flag assertion to Android.
- iOS Files needed a synthetic fixture placed in its local simulator provider and a
  Browse refresh; tapping the thumbnail imported successfully. Save to Files from
  the export sheet did not show a destination in this simulator: generated JSON and
  share presentation are verified, saving to a chosen Files destination is not.
- Native fixtures/flows and setup instructions are saved in .maestro and README to
  reduce repeated investigation. Screenshots/report are in the chat workspace at
  outputs/fitness-m5; full run artifacts are under work/qa/m5-* (ignored).
- M5 functional implementation is in place. Hero/body/female visual acceptance still
  depends on a new approved release; M4 body alignment/direct taps remain open.
  Next is M6 remote-content validation/cache/atomic activation with local fixtures.
  M7 remains gated on Oktay's accounts/model approval. M8 release, accessibility and
  physical-device performance acceptance remain pending.
- Final iOS rerun passed both saved-preferences UI assertions and available-video
  playback/pause with female selected; Android's matching video fallback flow also
  passed. Working tree clean after checkpoint commits.

## 2026-10-28 — App polish and development content preview handoff

- Added development-only snapshot tooling for the current technically validated
  male/female renders from `fitness-automation/dist`. The local snapshot is selected
  only with `EXPO_PUBLIC_CONTENT_PREVIEW=1` in `__DEV__`; otherwise the bundled
  v0.1.0 release is used. Preview metadata is visibly marked as awaiting appearance
  and form review. This is a placeholder, not approved or publishable content.
- Preview uses white as its video/poster canvas to match the user's 2026-10-26
  request in `docs/MVP.md`. That MVP edit was already in the working tree before
  this checkpoint and is intentionally left unstaged/uncommitted; keep it intact.
- Polish changes address larger text in the exercise grid, wrapping filter counts,
  accessible history calendar/delete actions, a browse action for empty history,
  clearer video retry errors, more readable undo feedback, and shared component
  accessibility/layout details.
- `git diff --check` passed. Prior checkpoint validation is 22 unit tests and
  TypeScript typecheck passing. iOS/Android M5 settings and playback Maestro checks
  passed before this polish. A new Android polish Maestro run was started but its
  completion was not captured; do not claim this polish itself passed native QA.
- That session ended before native QA of the polish. Resume by checking `git status`,
  running typecheck and tests, then smoking the preview and approved bundle on iOS and
  Android: poster-first playback for both models, scrolling, settings label, large-text
  layout, history accessibility and video error retry.
- Before committing, stage only app-owned polish/preview files and README. Do not
  stage the pre-existing `docs/MVP.md` white-background note. Commit in a small
  plain-message checkpoint. Current source renders still have no human content
  approval and there is no published updated release. Next product milestone is M6
  local-fixture testing for remote content validation/cache/atomic activation, after
  completing this polish QA; do not create paid services/accounts. Keep M4 body-map
  alignment and direct region taps, M7, and M8 open as above.

## 2026-11-03 — v0.3.0 content, dark/lime redesign, device builds (handoff)

State: `main` at the onboarding/Profile commit, pushed. Working tree clean. Supersedes
the preview notes above: the dev preview snapshot is gone and `EXPO_PUBLIC_CONTENT_PREVIEW`
no longer exists.

- **Content.** `npm run content:import -- <fitness-automation>/releases` bundles whatever
  `current.json` points at (now v0.3.0: 30 exercises, male + female, white-background H.264
  loops and posters, body views with 17 masks and hit SVGs, heroes, 8 equipment icons). It
  checks the `content.json` digest and every file's bytes + sha256, and turns the hit SVGs
  into polygons (`src/content/hit-regions.json`, read by `src/content/hits.ts`). Types gained
  `"top"` and optional `equipmentIcons`; requests note in `docs/MVP.md`.
- **Structure.** Tabs: Home · Exercises · History · Profile (floating pill bar,
  `tabBarSpace` bottom padding on every tab screen). Onboarding is 4 steps: welcome, model,
  units, all set. Home's muscle list no longer scroll-syncs the body; selection comes from
  tapping the body (hit regions) instead.
- **Design.** Per `docs/DESIGN.md` (rewritten from the user's dark + lime references):
  Poppins via `src/components/Text.tsx` (always import `Text`/`TextInput` from there, not
  from `react-native`, or the font is lost on Android), lime `#C8FA3C` with black text,
  shared pieces in `src/components/ui.tsx` (`Stat`, `IconCircle`, `SectionTitle`,
  `Segmented`, `Group`/`Row`, pill `Button` with `arrow`), `BodyFigure`, `Avatar`. No fake
  metrics: everything shown is computed from local logs.
- **Verified.** Typecheck clean, 26 unit tests pass. Android emulator (`Dev_Phone`): full
  onboarding, all tabs, body tap, detail video, logging a weighted set, recovery and
  History updates, Profile totals. iPhone 14 Pro: signed dev client installed and loaded
  the redesign's predecessor over LAN; the final redesign was not seen on the phone (it was
  locked), so iOS visuals (blur tab bar, SF Symbols, font) are unverified. Maestro flows were
  updated for the new onboarding and Profile but not run.
- **Running on devices.** `npx expo start --dev-client --lan` (phone and Mac on the same
  Wi-Fi). Android: `adb reverse tcp:8081 tcp:8081`, then open Fitness. iPhone build:
  `xcodebuild -workspace ios/Fitness.xcworkspace -scheme Fitness -configuration Debug
  -destination 'id=<udid>' -allowProvisioningUpdates DEVELOPMENT_TEAM=2UNNRK9L5Q
  CODE_SIGN_STYLE=Automatic build`, install with `xcrun devicectl device install app`.
  If Pods point at a missing `node_modules` path, run `LANG=en_US.UTF-8 pod install` in
  `ios/`. Only rebuild native when native deps or `app.json` plugins change (Poppins loads at
  runtime through the existing ExpoFont module).
- **Open.** iOS visual check of the redesign; run the Maestro flows on both platforms;
  M6 remote content (fetch `current.json` → `content.json`, verify sha256, cache, atomic
  switch, keep bundled fallback; local fixtures only, no hosting until the user says so);
  M7 monetization (needs the user's accounts decision); M8 release prep (icon, splash,
  store assets, accessibility and performance passes). The Mac disk runs near full; device
  builds use several GB of DerivedData.

## 2026-11-03 — M6 remote content

- `src/content/remote.ts` (pure, node-tested) + `src/content/device.ts` (expo-file-system IO,
  native SHA-256) + `src/content/updates.ts` (launch/foreground checks). Configured by
  `EXPO_PUBLIC_CONTENT_URL`; unset means bundled only, so nothing changes until hosting exists.
- Flow: `current.json` → `content.json` (size + sha256 against the pointer, schema checks,
  unknown fields/muscles/views dropped) → only media whose sha256 is not already bundled or
  downloaded → each verified → `files/<sha256>.<ext>`; hit-region SVGs become polygons. The
  switch is one rename of `state.json`; it applies at the next JS start (Profile shows a
  restart row). Startup: active → previous → bundle; a newer bundle after an app update wins.
  Host pointing back at the bundled version = rollback to the bundle. Active + previous kept,
  the rest pruned.
- Deviation from MVP.md: videos are downloaded with the release, not lazily on first view.
  Releases are small (v0.3.0 is 14 MB in full, and only changed files are fetched), and it
  keeps the app fully offline and every file sha-verified before activation.
- Verified: 37 unit tests (11 new: incremental download, throttle, corrupt/missing file,
  pointer mismatch, newer schema, previous fallback + repair, pruning, rollback, newer bundle,
  SVG hits, unsafe paths); typecheck. Android `Dev_Phone`: fixture v0.3.1 (v0.3.0 + mirrored
  push-up, `scripts/make_test_release.py`) fetched exactly its 8 new files, and after a restart
  `.maestro/remote-content.yaml` passed (31 exercises, new clip plays, Profile shows v0.3.1).
  Rolling the host back to v0.3.0 returned the app to 30 exercises and emptied its store.
- Not verified: iOS (no simulator run this session), a real HTTPS host, a crash-loop guard for
  a release that parses but breaks a screen. Open: hosting choice/upload (user's go-ahead),
  iOS redesign check, M7, M8.

## 2026-11-04 — Polish pass (handoff: test locally)

Branch `claude/eager-allen-1tdnnq`. JS only: no native dependencies, `app.json` plugins or
content changed, so the installed iOS/Android development builds keep working. Pull, then
restart the dev app (not just Fast Refresh) before testing.

**Fixes**
- Exercise detail: Close was the same chevron-down as "Next exercise"; it is now an X.
- Home "This week" counted log entries as "workouts" (five exercises in one session read as
  five workouts). It now counts training days, with a Mon–Sun bar strip (today outlined).
- Privacy said "no automatic content downloads" and "version 0.1.0" after M6 added update
  checks. It now describes the check only when `EXPO_PUBLIC_CONTENT_URL` is set (exercise
  content only, nothing personal sent), reads the version from `app.json`, and shows the
  local-server note only in development.
- Android hardware back in onboarding left the app; it now steps back (only while
  onboarding is focused, so it still closes Privacy).
- History could page into future months; › is disabled on the current month and a "Today"
  pill jumps back. Import dialogs no longer say "Add 1 logs" / "1 existing entries".
- Maestro: `fitness://settings` (route renamed to Profile) → `fitness://profile`; Body tab →
  Home; backup assertion text updated. Removed the unused `posterior` set on Home.

**Polish**
- Log sheet day stepper: log for an earlier day (Today → Yesterday → dates, never the future);
  editing an entry can move it to another day, keeping its clock time (clamped to now).
  Toasts read "Logged · Yesterday" / "Updated · Mon, Nov 2"; plain "Logged" for today.
- Set summaries everywhere (`src/storage/format.ts`): identical sets grouped
  ("3 × 10 · 40 kg, 1 × 8 · 45 kg"), bodyweight without "× 0 kg" ("3 × 12").
- Exercise detail "Best set" (heaviest, then most reps, first date) once two or more sessions
  have sets. Home day-streak tile shows the best streak. History shows a day summary
  ("2 exercises · 6 sets"). Body map: tap the selected muscle again or outside to clear.

**Verified here:** typecheck clean; 44 unit tests pass (7 new: plurals, grouped summaries,
pounds grouping, best set, longest streak, moving a log between days, day labels);
`git diff --check`; `expo export --platform android` bundles. **Not verified:** anything on a
device or simulator (none in this environment); Maestro flows were edited but not run.

**Local test checklist**

```sh
git fetch origin claude/eager-allen-1tdnnq && git checkout claude/eager-allen-1tdnnq
npm ci && npm run typecheck && npm test
NODE_OPTIONS=--dns-result-order=ipv4first npm start -- --localhost   # simulators
npx expo start --dev-client --lan                                    # physical phone
```

1. Log sheet: open an exercise → Log this exercise. Day shows Today and › is disabled. Tap ‹
   → Yesterday (lime) → Done → toast "Logged · Yesterday"; Undo removes it. Log again for
   yesterday: History marks yesterday, Home streak/This week update. Edit that entry from
   History, › to Today, Save → it moves to today.
2. Home: log three exercises today → This week = 1 training day, today's bar lime. Streak
   footer reads "Log today to start" on a fresh install, "Best: N days" after logging.
3. Body map: tap a muscle → its row; tap it again, or beside the body → selection clears.
4. Exercise detail: top-left is an X. Log the same exercise twice with sets (e.g. 3 × 10 at
   40 kg, then 8 at 45 kg): Last reads "3 × 10 · 40 kg"-style, "Best set" appears.
   A 0 kg set reads as reps only.
5. History: › disabled this month; go back a month → Today pill → returns and selects today.
6. Android onboarding (needs fresh data: export first, then
   `adb shell pm clear com.oktayshakirov.fitness`): on Model/Units/All set, hardware back goes
   to the previous step; on All set open Privacy, back closes Privacy and stays on the step.
7. Privacy: without `EXPO_PUBLIC_CONTENT_URL` → "Exercises are built into the app…"; with it
   → the update-check paragraph. Version line matches `app.json`.
8. Profile → Import the `.maestro/fixtures/backup.json` fixture twice → second result reads
   "Added 0 logs. Kept 1 existing entry."
9. Large text (Settings → Display/Accessibility → XL): Home stat tiles and the Log day row
   still fit.
10. Maestro (one device at a time): `library`, `body`, `tracking`/`tracking-ios`, `settings`,
    `backup-*` and the new `log-day.yaml`.

**Suggested next (not done):** CI on pull requests (`npm ci`, typecheck, tests); "Erase all
data" in Profile (decide whether it also resets onboarding); M6 crash-loop guard for a release
that parses but breaks a screen; tap a Home week bar to open that day in History; group
History "Recent" by day; rest timer (MVP "later"). Still open from before: iOS redesign visual
check, Maestro runs on both platforms, M7 and M8.
