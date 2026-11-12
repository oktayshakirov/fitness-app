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

**Round 2 (same branch)**
- Camera angles: the text pills (Front · Side · ¾ · Foot · Rear · Top) are now cards with each
  angle's own poster thumbnail and plain names checked against the v0.3.0 renders: `threeq` =
  Angled, `rear` = Rear angle (behind, angled; triceps/rope pushdown), `foot` = Foot end (bench
  press from the feet), `top` = Above (leg press from overhead). VoiceOver/TalkBack hints say
  where the camera is. Under 350 pt wide or with large text the name stacks under the
  thumbnail; an HTML mock at 390/375/360 pt showed no label overflow (mock, not a device run).
  The chosen angle carries over to the next exercise opened in the session.
- Exercises: "✓ Today" badge on exercises logged today; "Clear" header pill and a "Clear
  filters" empty-state button (the `library.yaml` "Clear filters" step now has a target).
- Log sheet: when collapsed, shows "Last time: 3 × 10 · 40 kg · Yesterday. Add sets starts
  from these." so the prefill is visible.
- History: Recent is grouped under day headings (Yesterday, Mon, Nov 2, …) with times on rows;
  tapping a heading selects that day, moves the calendar there and scrolls up.
- Recovery times read "ready in ~2 days" from 24 h (hours below that). Shared `PillButton`.
- Verified: typecheck, 45 tests (1 new for `readyIn`), `git diff --check`, Android bundle.

**Round 2 checks:** (a) bench press shows Angled · Side · Foot end, triceps pushdown Front ·
Side · Rear angle, leg press Angled · Side · Above; pick Side, swipe to the next exercise →
Side stays selected. (b) iPhone SE/mini or a 360 dp Android, and XL text: no clipped angle
names. (c) Quick-log an exercise → "Today" badge on its card. (d) Search "zzz" → Clear filters
resets everything. (e) Log sheet for an exercise logged before with sets shows "Last time".
(f) History: tap a Recent day heading → that day selected at the top. (g) Home muscle list
reads "ready in ~2 days" after a heavy chest log.

**Round 3 (same branch)**
- Error screens: every tab, the exercise screen, Log sheet and onboarding export an
  `ErrorBoundary` (`src/components/ErrorScreen.tsx`), so a throwing screen shows "Something went
  wrong" with Try again (and Close on stacked screens) while the rest of the app keeps working.
  The root layout's boundary hides the splash (it would otherwise stay up) and offers Restart.
  While a downloaded release runs, "Use built-in exercises" calls `rejectRelease`
  (`src/content/remote.ts`): back to the bundle at restart, and that version is never fetched
  again; a newer one is. This is the manual half of the M6 crash-loop guard. Styled
  `app/+not-found.tsx` replaces the router's debug page for unknown links.
- Video: "0.5×" slow-motion toggle beside play/pause, kept for the session. The rate is only
  set when playing because on iOS a non-zero `playbackRate` starts playback.
- Search: word-start matching (fixes "tri" hitting hamstrings), synonyms (legs, arms, back,
  core, pecs, quads, delts, db/bb/kb, rdl, ohp, "dumbell"), plurals, missing spaces ("push ups"),
  equipment chip names ("machine"). Placeholder "Search name, muscle, equipment".
- Bug: the Bodyweight chip missed Bodyweight Squat and Forward Lunge (no equipment listed) and
  their cards showed an empty equipment line. They now count as Bodyweight.
- Log sheet steppers repeat while held. Exercise screen lists "Your sessions (n)". History rows
  show notes; deleting gives a warning haptic. Home stat tiles open History. Root view is dark
  via `expo-system-ui` (installed since the first commit, so no rebuild).
- Verified: typecheck; 50 tests (5 new: rejected release, synonyms, plurals/spaces, word
  starts, no-equipment chip); `git diff --check`; Android and iOS bundles export.

**Round 3 checks:** (h) Exercise video: 0.5× turns lime and slows the loop; the next exercise
stays slow; on iOS, pause, toggle 0.5×, and the video must stay paused until Play. (i) Search
"legs", "pecs", "db curls", "push ups", "rdl"; "tri" lists only triceps work. (j) Bodyweight chip
includes Bodyweight Squat and Forward Lunge; their cards read "Bodyweight". (k) Log sheet: hold +
on weight, it climbs until released. (l) An exercise logged twice shows "Your sessions (2)".
(m) A History entry with a note shows it. (n) Home: tapping Day streak or This week opens History.
(o) Error screen: temporarily put `throw new Error("test");` as the first line of `Home()` in
`app/(tabs)/index.tsx`, reload: Home shows the error card, other tabs work; remove it, Try again
recovers. (p) With the remote fixture active (v0.3.1, README "Remote content"), repeat (o): the
card offers "Use built-in exercises"; tap it → app restarts on 30 exercises, Profile shows
v0.3.0, and the next check logs `[content] {"status":"current"}` without downloading v0.3.1.
(q) Unknown link → "Page not found" → Go to Home:

```sh
xcrun simctl openurl booted fitness://nope
adb shell am start -a android.intent.action.VIEW -d fitness://nope
```

**Round 4: motion (same branch)**
- `src/components/motion.tsx`: `PressableScale`/`usePressScale` (spring scale on press, skipped
  with Reduce Motion), `ProgressBar`, shared timings. Everything runs on the UI thread with
  the already-installed Reanimated 4; no new dependencies, no rebuild.
- Applied: press feedback on Button, IconButton, Chip, PillButton, Stat, ModelChoice, angle
  cards, grid cards and the lime recovery card; sliding Segmented pill with colour-following
  labels; tab cross-fade (off with Reduce Motion) and animated active pill; toast slide/fade
  with an Undo countdown line; Home recovery bar, Front/Back cross-fade, muscle row fade;
  exercise info slides in from the swipe direction, section chevrons rotate and cards glide;
  quick-log "+" pops into a check (keyed per exercise so recycled cells never show another
  exercise's check); Log set rows enter/exit with stable ids; History month slide, day-list
  fade, row reflow; onboarding step slides, stretching dots, welcome and "all set" entrances.
- Performance guardrails: transform/opacity only (two small width animations), ≤ 220 ms except
  the 600 ms recovery bar, no loops, no entering/layout animations in FlashList.
- Verified: typecheck, 50 tests, `git diff --check`, Android and iOS bundles; a plain-JS export
  confirms the new animation functions are compiled into UI-thread worklets. Not verified:
  how any of it looks or performs on a device.

**Round 4 checks:** (r) Tap and hold buttons, chips and grid cards: a slight shrink and spring
back, no delay to the action. (s) Profile units/recovery speed and Home Front/Back: the lime
pill slides and the labels change colour with it. (t) Switching tabs cross-fades; the lime
pill grows behind the new icon. (u) Quick-log from the grid: toast slides up with a lime line
running down for 10 s; Undo fades it down; the "+" pops into a check. (v) Exercise screen:
swipe up/down, the info slides in from below/above; open and close How to/Cues, the chevron
turns and the cards below glide. (w) Log sheet: Add sets, add and remove sets, rows slide in
and fade out, the note glides. (x) History: page months both ways; delete a row and Undo, the
rows glide. (y) Fresh onboarding: welcome entrance, step slides both ways, stretching dots, the
check pops on "You're all set". (z) Turn on Reduce Motion (iOS: Accessibility → Motion;
Android: Accessibility → Remove animations), restart the app: no slides, scaling, tab fade or
countdown line; everything still works. Also scroll the Exercises grid and History on the
Android emulator (or a mid-range phone) and watch for dropped frames.

**Round 5: rest timer and erase (same branch)**
- Rest timer: `src/workout/rest.ts` (two timestamps; clock, progress, spoken duration; tested),
  `src/workout/restTimer.ts` (one app-wide timer, a clock that re-renders on each whole second
  and on return to the foreground), `src/components/RestTimer.tsx`. `RestTimerHost` in the root
  layout owns the side effects (3-2-1 light ticks, success haptic and "Rest over" announcement
  at zero, no late buzz if it ended in the background) and floats the pill 146 pt above the
  bottom inset, above the toast lane. Start it with the timer button beside "Log this exercise"
  or "Rest 1:30" in the Log sheet's sets block, where the countdown also shows (sheets cover
  root overlays). Length in Profile → Training → Rest timer (30 s to 3 min, default 90 s);
  `restSeconds` is optional in saved settings and backups, so older ones still load.
- Erase all logs: Profile → Your data. Confirmation offers Export first; Erase deletes every
  log in one transaction (`src/storage/erase.ts`, tested on real SQLite), then `VACUUM` and a
  WAL checkpoint so erased notes do not stay on disk, and removes exported backup copies from
  the cache. Settings and onboarding stay. A toast offers Undo for 10 s (restores the same
  rows). Privacy copy updated.
- Not built: a sound or notification when rest ends while the app is closed. That needs
  `expo-notifications` and a native rebuild.
- Verified: typecheck; 58 tests (8 new: timer math, clock, spoken durations, optional rest
  setting, erase keeps settings, Undo restores exactly once, failed erase rolls back);
  `git diff --check`; Android and iOS bundles.

**Round 5 checks:** (A) Exercise screen: tap the timer button → pill floats above the bar with a
countdown and running line; +15 s adds time; Skip hides it; tapping the button again restarts.
(B) Let it run out with the phone in hand: light ticks at 3-2-1, a success buzz, lime "Rest over"
that hides after 5 s. (C) Start a rest, lock the phone past the end, unlock: "Rest over" shows,
no buzz. (D) Log sheet → Add sets → "Rest 1:30": the countdown runs inside the sheet; save the
sheet and the floating pill continues. (E) Profile → Rest timer 2:00: the sheet button reads
"Rest 2:00"; restart the app, the choice is kept. (F) With logs: Profile → Erase all logs →
confirmation → Erase: History empties, Home resets, Profile totals read 0, you stay onboarded
with the same model and units; Undo in the toast brings every log back. (G) Erase, wait past
10 s: logs stay gone; exporting afterwards gives an empty backup. (H) VoiceOver/TalkBack: the
pill reads "Rest timer, 1 minute 23 seconds left", buttons "Add 15 seconds" and "Skip rest".
Maestro: `.maestro/rest-timer.yaml`.

**Round 6: features (same branch)**
- Routines: migration 3 adds a `routines` table; `src/storage/routines.ts` (validation, today's
  progress, next exercise, reorder; tested); store CRUD with Undo on delete; backups carry
  routines as an optional field (schema stays 1, merged by id, older backups still import).
  Home "Routines" section, `app/routine/[id].tsx` (progress, ordered list, Start/Continue) and
  `app/routine/edit.tsx` (name, order, searchable catalog; asks before discarding). The
  exercise screen walks the routine: header "Push day · 2 of 5", previous/next in order.
- Progress chart (`src/components/ProgressChart.tsx`, `progressSeries` tested): last 12 sessions,
  heaviest set or volume (reps for bodyweight), built to the dataviz rules: emphasis form,
  gray #6E6E73 validated at ≥ 3:1 on the card, columns from zero, sparse labels.
- Personal records: `newBest` (tested). Beating every earlier set shows a trophy toast "New best:
  8 reps · 62.5 kg" and announces it; first logs and edits never count.
- Weekly goal: `weeklyGoal` (2–6, default 3, optional in saved settings and backups). Home tile
  "2 of 3 days", a trophy once met; Profile → Training → Weekly goal.
- Ready to train: `suggestExercises` (tested). Primary muscles fully recovered, secondary not
  freshly trained, rested longest first (never-trained first), one per primary muscle,
  favourites win ties. Home card with up to three picks.
- Favourites: `favorites` in settings (optional in backups). Star on the exercise screen, a
  "Favorites" chip in Exercises once anything is starred, a lime star on cards, previous/next
  stay within favourites, an empty state when none are left.
- One-rep max and plates: Epley estimate (1–12 reps) on the best-set line; a plate calculator on
  barbell exercises (per side, 20/15 kg or 45/35 lb bars, computed in hundredths; tested).
- CI: `.github/workflows/ci.yml` runs `npm ci`, typecheck, tests and an Android JS bundle on pull
  requests and pushes to `main`. Its first run on this PR passed on GitHub.
- Verified: typecheck; 71 tests (13 new); `git diff --check`; Android and iOS bundles; CI green;
  chart layout checked in an HTML mock. Not verified: anything on a device.

**Round 6 checks:** (I) Home → Create a routine: name it, add three exercises, reorder, Save →
the routine screen. Start workout → header "<name> · 1 of 3"; log it; swipe up → 2 of 3; back
on the routine screen: 1 done, Continue. (J) Edit the routine (rename, remove one); delete it
from the header; Undo in the toast restores it. (K) Export with a routine and a favourite; Erase
all logs keeps both; importing the backup restores them. (L) On an exercise logged before, log a
heavier set → trophy toast "New best: …"; a first log or a tie shows "Logged". (M) An exercise
logged twice with sets shows Progress; switch Heaviest/Volume and tap columns; a bodyweight
exercise charts reps with no switch; the best-set line shows "est. 1RM". (N) Barbell exercise →
Plate calculator: 100 kg on a 20 kg bar → 25 · 15 per side; 61 kg → a note that 1 kg cannot be
made; in lb the bars are 45/35. (O) Star an exercise → Favorites chip in Exercises; filter; the
card shows a star; unstar → "No favorites yet". (P) Profile → Weekly goal 4 days → Home reads
"x of 4 days"; reaching it shows a trophy. (Q) Ready to train: a new user sees three varied
picks; after a heavy chest log, no chest picks until chest has recovered. Maestro:
`.maestro/favorites.yaml`, `.maestro/routine.yaml`.

## 2026-11-04 — Session end: moving to the local build

The polish pass (rounds 1–6 above) is merged into `main` through PR #1. To continue locally:

```sh
git checkout main && git pull
npm ci
npm run typecheck && npm test
NODE_OPTIONS=--dns-result-order=ipv4first npm start -- --localhost   # simulators
npx expo start --dev-client --lan                                    # phone on the same Wi-Fi
```

- No native rebuild is needed: `package.json` dependencies and `app.json` plugins did not change
  in this pass. Everything uses modules already in the installed development builds
  (Reanimated, expo-haptics, expo-system-ui, expo-file-system, expo-video, expo-sqlite).
  Restart the development app after pulling rather than relying on Fast Refresh.
- First launch runs SQLite migration 3 (the `routines` table) automatically; logs and settings
  are kept, and older backups still import.
- Test in this order: the round checklists above (1–10, a–g, h–q, r–z, A–H, I–Q), then the
  Maestro flows one device at a time (library, navigation, body, tracking or tracking-ios,
  settings and settings-persistence, backup-*, model-fallback, log-day, rest-timer, favorites,
  routine). Tracking and routine flows add and remove their own data; failed runs may leave
  some behind.
- Not verified in this session: anything on a device or simulator, the Maestro flows, real
  performance of the animations, VoiceOver and TalkBack.
- Still open: a rest-over notification while the app is closed (`expo-notifications`, native
  build); automatic M6 crash-loop detection for native crashes; tapping a Home week bar to open
  that day in History; the iOS redesign visual check; Maestro runs on both platforms; M7
  monetization (needs the accounts decision); M8 release prep (icon, splash, store assets,
  accessibility and performance passes on a mid-range Android phone, web export).

## 2026-11-05 — Device QA of rounds 1–6 (Android emulator + iOS simulator)

First device run of the polish pass. Android `Dev_Phone` (API 36) and iPhone 17 Pro simulator
(iOS 26.5), development builds over Metro. No native rebuild.

**App fixes**
- Links into Exercises from Home (muscle rows, "All exercises") and from an exercise's muscle
  chips now clear an earlier search, equipment chip and Favorites filter. Before, tapping Chest
  after searching "barbell bench press" showed 1 exercise instead of 4. Links carry an `at`
  token; choosing a muscle inside Exercises still keeps the search.
- Profile → Weekly goal read "2 da… 3 da…" on a 411 dp Android phone at normal text size.
  Options are now 2–6 with "Training days per week" in the caption; TalkBack/VoiceOver still
  hear "3 days" (new optional per-option `accessibilityLabel` on `Segmented`).
- VoiceOver read icon glyphs: the main button was "Log this exercise, " and chip icons
  were separate elements with private-use characters. New `src/components/Icon.tsx` hides
  Ionicons from screen readers (all 45 uses switched); icon-only buttons keep their labels.
- Quick-logging from the Exercises grid while searching dismisses the keyboard, so the
  "Logged" toast and its Undo are not hidden behind it.

**Checked and fine:** the iOS redesign (Poppins, dark/lime cards, blurred floating tab bar,
angle cards with plain names), toasts on both platforms (the iOS "missing toast" was Maestro
waiting out the countdown line, confirmed with timing logs), the rest pill on both, History.

**Maestro:** all flows had been written for the old screens and never run. Updated for the
current UI (toast text patterns, "Log this exercise", Home sections above the muscle list,
scroll positions kept between runs, the floating tab bar covering bottom rows, a routine of
exercises no other flow logs, a wait for set rows). README lists the platform quirks.
- Android: every flow passes; most in one ordered run, the rest on rerun after fixes.
  `tracking.yaml` takes over 5 minutes there (video screens are slow for UiAutomator).
  `rest-timer.yaml` is iOS-only (a per-second countdown never lets UiAutomator go idle);
  the timer itself was checked by hand (start, +15 s, skip).
- iOS: navigation, body, log-day, settings, settings-persistence, model-fallback, rest-timer,
  favorites and routine pass. Open: `library.yaml` (inside the flow the search field ends up
  empty after typing; the same steps pass alone) and `tracking-ios.yaml` (fails after library
  leaves the grid in another state). Neither looked like an app bug in manual checks.
- Not checked: physical phones, real performance of the animations, TalkBack/VoiceOver by
  ear, Reduce Motion by eye, large text on device, Android backup on iOS.

**Next:** finish the two iOS flows; then M8 release prep (icon, splash, store screenshots,
privacy page, accessibility and performance passes on a mid-range Android phone). M7 still
waits on the accounts decision. Rest-over notification (`expo-notifications`, native build)
and tapping a Home week bar to open that day remain open.

## 2026-11-05 — M8 release prep, part 1

**Release builds crashed at launch; fixed.** The first iOS Release build died in dyld:
`ExpoFont` (prebuilt xcframework from npm, 58.0.11) needs a symbol that the installed
`expo-modules-core` 58.0.26 lacks. Debug builds were fine, so it never showed during QA.
Updated Expo to 58.0.23 and ran `npx expo install --fix` (13 SDK 58 patch updates, core now
58.0.30; it also added the expo-image and expo-sharing config plugins). After switching, Xcode
needed this app's DerivedData removed (stale precompiled module maps).

**Done**
- Icon, Android adaptive + themed (monochrome) icon, splash mark and web favicon in
  `assets/brand`, drawn by `swift scripts/make_brand_assets.swift` from the design tokens.
  Checked on the iOS home screen, the iOS launch splash and the Android launcher.
- `public/privacy-policy.html` (hostable; matches the in-app Privacy screen) and
  `docs/STORE.md` (listing copy, App Store / Play privacy answers, screenshot plan, checklist).
- Android release permissions cut to INTERNET, VIBRATE, ACCESS_NETWORK_STATE, WAKE_LOCK
  (`android.blockedPermissions` for overlay and legacy storage).
- Contrast: `tests/contrast.test.ts` holds every text colour to WCAG AA on bg/surface/surface2
  (secondary is 5.9-6.7:1). Unselected radio rings moved from tertiary (2.5:1) to secondary.
- Release builds (no Metro) start offline from bundled JS and content on the iPhone 17 Pro
  simulator and the Android emulator; onboarding, Home, Exercises and video playback checked.
- Large text: iOS XXXL and Android 1.3× look right (grid goes to one column, angle cards
  stack). Profile's stat tiles were uneven when "Active days" wrapped; they now stretch.

**State of the test devices:** both have the release build installed, not the development
build; run `npm run ios` / `npm run android` before the Maestro flows. The iOS simulator's text
size is back at the default (large).

**Open for M8:** store name (Apple's built-in "Fitness" sits beside it on the home screen),
contact email and privacy URL (Oktay); screenshots from a release build with clean demo data;
web export of the library; VoiceOver/TalkBack by ear and AX text sizes; 60 fps on a physical
mid-range Android phone. Small: at XXXL the Exercises search placeholder truncates ("equi").

## 2026-11-09 — Named Muscle Pal; muscle icons in the UI

- App name is now **Muscle Pal** (`expo.name`, onboarding wordmark, privacy page, messages). The
  bundle ID, slug, database file and backup filenames stay `fitness`; the bundle ID is still free
  to change until the first submission. Risks are in `docs/STORE.md`.
- App icon, Android layers, splash and favicon now come from the chest logo.
- 17 muscle icons (256 px, 1 MB total; the 1254 px sources are not bundled): Home muscle list with
  a recovery badge, the selected-muscle row under the body map, Exercises muscle filter as tiles,
  the active filter chip, and the exercise screen's primary chip and Primary/Secondary rows.
- Exercises: the muscle tiles are always visible, "All muscles" is a tile like the others and the
  collapse button is gone. A link to a muscle scrolls its tile into view.
- Onboarding, the model choice and the avatars (Home and Profile) use the generated pictures in
  `assets/ui/model-placeholders`, resized into `assets/ui/models`. Videos and the body map stay on
  the 3D models. Maestro flows were not rerun after these screen changes.

## 2026-11-10 — Bundle ID, privacy page, rest-over notification

- Bundle ID and Android package are `com.shadev.musclepal`. Slug, URL scheme, database file and
  backup filenames keep "fitness" (internal only).
- Privacy page: `privacy-policy/muscle-pal.html` in the portfolio repo, same template as the other
  apps, contact muscle-pal@oktayshakirov.com. It describes a build with no ads or analytics, so it
  must gain the AdMob, purchases and consent sections before M7 ships.
- Rest over notification: local only (`src/workout/restNotification.ts`, `expo-notifications` with
  `enableRemoteNotifications: false`, so no APNs entitlement, Firebase project or server).
  Permission is asked the first time a rest starts. In the foreground the pill and haptic do the job.
  Android 14+ delays it (a 90 s rest arrived at 149 s) unless exact alarms are on, so the app declares
  SCHEDULE_EXACT_ALARM and Profile shows an "On-time rest alerts" row while it is off.
- Home week strip stays as it is: tapping it opens History. No per-day link planned.

## 2026-11-10 — M7: ads, Pro and widgets

Built like Drone Pal and the Tinnitus and Crypto apps. Decisions from Oktay: Pro = no ads, widget and
routines (free plan keeps 3 routines); charts and records stay free; monthly and lifetime at Drone Pal's
prices (€2.99 and €29.99). Banner on Exercises and History only, above the tab bar.

- Ads: `src/ads/ads.ts`, `src/components/AdBanner.tsx`. Consent is Google UMP, then Apple's tracking prompt,
  started the first time a free user reaches a banner screen.
- Pro: `src/pro/pro.ts`, `src/components/ProSection.tsx`; RevenueCat's paywall.
- Widgets: `src/widget/`, `targets/widget/index.swift`. The app writes when each muscle recovers, so the
  widget counts down by itself.
- Rest alerts are now opt-in from Profile; the system prompt only appears after the user turns them on.
- Contact rows and the store-related constants are in `src/contact/contact.ts`.

Needed before release: AdMob app IDs (`app.json`, currently Google's sample IDs) and banner unit IDs
(`src/ads/ads.ts`; release builds show no ads until set), a published GDPR message in AdMob,
RevenueCat project with entitlement "Muscle Pal Pro", products `monthly` and `lifetime`, a paywall, and
`EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.
Purchases and real ad fill need a real device and those accounts, so they have not been tested.

Notes: RevenueCat is pinned to 10.16.0 because the iOS library 11.x needs is not on CocoaPods yet. The banner is
the fixed 320×50 size; adaptive banners came out over 100 dp tall on Android. Checked on the iOS simulator and
Android emulator with Google's test ads and a dev Pro switch: consent, banner, Pro state, both widgets, opt-in
alerts, splash. Not checked: real purchases and ad fill, the iOS tracking prompt (the simulator reported
"granted" without showing it), the 3-routine alert on screen (unit test only), release builds, Maestro flows.

## 2026-11-10 — Version 1.0 without ads and purchases

Oktay's call: submit 1.0 first; add ads and RevenueCat before a later submission, once the name is safe and
the in-app purchases exist in the stores. Commit c6e2505 has the complete monetized app (banner now at the
top of Exercises and History, in the page flow, because the floating tab bar left no room at the bottom).
The next commit removes AdMob, RevenueCat and the tracking prompt; widget and unlimited routines are free in
1.0. Reverting that commit restores everything. When Pro launches, decide whether 1.0 users keep the widget.

## 2026-11-11 — Light mode, store-ready 1.0

- Light mode: onboarding step "Appearance" (Automatic / Light / Dark, Automatic by default) and the same
  choice in Profile; switching repaints in place. Design notes in DESIGN.md "Light and dark".
- Splash follows the phone's scheme (light: dark-green name on #F2F2F7). Android 12+ masks the splash icon
  to a circle, so Android gets a smaller logo-and-name image that fits inside it.
- Android launcher icon: smaller mark inside the adaptive circle (Pixel on Android 16 crops tighter than the
  guideline) and a flat legacy/round icon without the glow ring.
- Version 1.0.0 (iOS build 1, Android versionCode 1).

## 2026-11-10 — iPad and Apple Watch

- iPad: `supportsTablet: true`, all four orientations on iPad (iPadOS windows are resizable, and App Store
  validation wants them), iPhone stays portrait. Content is capped to a centred 720 pt column
  (`contentWidth`, `s.column`); the Exercises grid shows three columns on a wide column; the exercise video
  stays under about half the window height; the floating tab bar keeps a phone width and labels below icons.
- Apple Watch: read-only companion app plus complications, fed by the widget summary over WatchConnectivity.
  See README "iPad and Apple Watch". Logging from the watch is not built (it would need two-way sync).
- Store: iPad and Apple Watch screenshots are now required (STORE.md).
- Checked: iPad Pro 13" simulator, portrait and landscape (onboarding, Home, Exercises, exercise detail,
  History, Privacy). Apple Watch on a paired iPhone 17 Pro + Series 11 simulator pair (`xcrun simctl pair`,
  then `xcrun simctl install <watch> MusclePal.app/Watch/MusclePalWatch.app`): the summary arrives when the
  phone app starts and after each log. Not checked: complications on a face, a real watch, Profile and the log
  sheet on iPad.

## 2026-11-10 — Session end: Oktay submits 1.0 (handoff)

State: `main` at c8095a2 (iPad + Apple Watch), everything pushed. Version 1.0.0 (iOS build 1, Android
versionCode 1), no ads, no purchases, widget and routines free. Oktay is uploading to Google Play and the App
Store himself; the next session starts after that.

Before or during the upload:
- The App Store build now contains the Watch app, so App Store Connect asks for Apple Watch screenshots
  as well as iPhone and iPad ones (sizes in STORE.md "Screenshots").
- Building iOS locally needs Xcode's watchOS platform (`xcodebuild -downloadPlatform watchOS`, installed
  on this Mac).
- The portfolio privacy page (`privacy-policy/muscle-pal.html`) does not mention the Apple Watch yet; the
  in-app Privacy screen does. The App Store privacy answers stay "Data not collected" (phone-to-watch
  transfer is on-device, no server).
- Untracked `assets/brand/muscle-pal-exploration/` is Oktay's and was never committed.

Next steps, in the order to discuss:
1. Whatever the store reviews send back (rejections, metadata questions).
2. Remaining checks: complications on a watch face and a real paired watch, Profile and the log sheet on iPad,
   VoiceOver/TalkBack, a mid-range Android phone (STORE.md checklist).
3. The monetized version: revert 313ba42 to bring back ads and Pro (c6e2505), then the AdMob, RevenueCat and
   privacy-page work listed under "M7: ads, Pro and widgets". Decide whether 1.0 users keep the widget.
4. Ideas not started: logging from the watch (needs two-way sync), localization.

## 2026-11-12 — Version 1.1.0: ads and Pro are back

Reverted 313ba42, so the c6e2505 ads + Pro code is live again on top of light mode, iPad and the watch app.
- AdMob: app IDs in `app.json` (iOS `~8420902067`, Android `~2576889307`), banner units in `src/ads/ads.ts`.
- RevenueCat: keys in `src/pro/pro.ts`. Oktay set up the `default` offering like Drone Pal's, with
  `musclepal_monthly` (`$rc_monthly`) and `musclepal_lifetime` (`$rc_lifetime`) and a paywall; checked against
  RevenueCat's offerings API with the iOS key. Any active entitlement counts as Pro, and the paywall is
  `presentPaywall` (current offering), so the code does not depend on the entitlement's name.
- Android key (`goog_`) added the same day and checked against the offerings API: same `default` offering.
- 1.0 users lose the free widget and routines past 3 unless they buy Pro (the open question from 1.0;
  defaulted to the planned gating).
- Version 1.1.0, iOS build 3, Android versionCode 3. Native folders regenerated with prebuild.
- Checked: typecheck, 79 unit tests, prebuild + pod install. Not checked: a device build, real purchases,
  real ad fill (needs a published AdMob GDPR message and approved units).

## 2026-11-12 — Android 1.1.1 (versionCode 4): Play Billing warning

Play Console flagged versionCode 2 (1.0.1): "Play Billing Library version AIDL, update to at least 8.0.0".
That build declared the BILLING permission with no billing library in it, so Play read it as the old AIDL
billing. The 1.1.x builds ship Play Billing 8.3.0 through RevenueCat (react-native-purchases 10.16.0 ->
purchases-hybrid-common 19.17.0 -> purchases 10.30.0 -> billingclient 8.3.0, checked with
`./gradlew :app:dependencies`). Android moved to 1.1.1 / versionCode 4 with `android.version` in app.json;
iOS stays 1.1.0 build 3.

## 2026-11-12 — Remote content is live on Cloudflare

M6 was built and tested on 2026-10-30 but never switched on (no hosting, URL unset). Now:
- Hosting: `muscle-pal-content`, an assets-only Cloudflare Worker on Oktay's account (the one with the Drone
  Pal weather proxy), serving `fitness-automation/releases` at https://muscle-pal-content.oktayshakirov.workers.dev/.
  Config `fitness-automation/hosting/wrangler.jsonc`; deploy and rollback in that repo's README "Hosting".
  Workers instead of Pages: Cloudflare's current recommendation, same free static-asset terms.
- App: `src/content/updates.ts` defaults to that URL, so builds from now on check for content.
- Checked: every hosted file of a 40-file sample is byte-identical; the app's own `checkForUpdate` run from
  Node against the live Worker says `current` (hosted v0.3.0 = bundled), and against a temporary Worker
  with the v0.3.1 fixture it staged v0.3.1 and downloaded only the 8 new files (Worker deleted afterwards).
  Cloudflare's bot check answers 403 to Python's user agent; okhttp and CFNetwork user agents get 200.
- Not checked on a phone yet: the M6 Maestro flow ran against a local server, not Cloudflare.
- Builds made before this commit (1.0.x, and any 1.1.x built earlier) never check; build from this commit.

## 2026-11-12 — Pre-release review of 1.1.x

- Content updates: a failed check (offline at the gym, host down) now retries after 30 minutes instead of
  waiting the full 6 hours; files already verified stay, so the retry resumes. Test added (80 pass).
  Reviewed and fine as is: unknown muscles/equipment/views are dropped, not fatal; removed exercises show
  without a clip in History and as "no longer in the library" in routines; a release switches atomically.
- iOS: Google's 50 SKAdNetwork IDs via the AdMob plugin (`skAdNetworkItems` in app.json); Info.plist had none.
- App version shown in Profile, Privacy and bug reports is the platform's own (`src/version.ts`), so Android
  shows 1.1.1, not the shared 1.1.0.
- Release builds: iOS Release on the iPhone 17 Pro simulator and Android release on the Dev_Phone emulator
  (Android 16): onboarding, Exercises with a banner from the real ad units (shown as test ads on
  simulators), Profile Pro section, Restore purchases, Content v0.3.0, App version. Pixel_9_Pro_oktayshakirov_
  has a screen lock and stays RUNNING_LOCKED after boot, so use Dev_Phone for scripted checks.
- `app-ads.txt` is live on oktayshakirov.com with pub-5852582960793521.
- Found, Oktay to fix in RevenueCat's paywall editor: the paywall was copied from Drone Pal. Its feature list
  is Drone Pal's (forecast, camera tutorials, locations, map), it shows "40% OFF" (lifetime is about 16% under
  a year of monthly) and "3-Day Trial", and Privacy and Terms both open Drone Pal's privacy policy.
- Open: APP_STORE_ID in `src/contact/contact.ts` (App Store Connect "Apple ID") so "Rate Muscle Pal" can
  fall back to the review page; TikTok and YouTube rows show "Soon" until the accounts exist.

## 2026-11-12 — Pro perk: common mistakes; free plan keeps 2 routines

Oktay's calls: free plan 2 routines (was 3); the paywall's "40% OFF" stays (lifetime is priced as a discount
on its usual price); the RevenueCat paywall copy and links are fixed on his side.
- Exercise detail: How to, Cues, Common mistakes and Breathing are always open, as cards with icon badges
  (`src/components/ExerciseGuide.tsx`). Common mistakes is Pro-only: free users get redacted bars, a PRO
  badge and "Unlock with Pro" (the paywall). Pro perks list and the routine-limit alert mention it.
- Existing free users with more than 2 routines keep them; they only cannot add another.
- "Rate Muscle Pal" falls back to the App Store review page (Apple ID 6833173152). TikTok and YouTube rows
  link to @muscle_pal (accounts to be created by Oktay).


## 2026-11-12 — Session end: 1.1 ready to build (handoff)

State: `main` at b15dca8, everything pushed (fitness-automation at f380a02). iOS 1.1.0 build 3, Android 1.1.1
versionCode 4 (`android.version` in app.json). This session: ads and Pro back (AdMob + RevenueCat, both keys
checked against RevenueCat), Play Billing 8.3.0 confirmed, remote content live on Cloudflare, failed content
checks retry after 30 min, SKAdNetwork IDs, platform version display, Common mistakes as a Pro perk in an
always-open exercise guide, free plan 2 routines, App Store ID and @muscle_pal links. Release builds checked
on the iOS simulator and the Dev_Phone emulator; 80 unit tests pass.

Oktay, before or during the 1.1 upload:
- Build both platforms from `main` (older builds never check for remote content). Native folders are
  generated and up to date locally; after a `prebuild --clean`, rerun pod install with `LANG=en_US.UTF-8`.
- RevenueCat paywall: copy and links fixed by Oktay; add "Common mistakes on every exercise" to its perks so
  it matches Profile. "40% OFF" stays (his call).
- AdMob: publish the GDPR consent message (no EU form appears until then); wait for the ad units' approval.
- Stores: privacy answers (STORE.md "Privacy answers"), age-rating questionnaires (ads, in-app purchases),
  Play ads declaration, developer website oktayshakirov.com (app-ads.txt is live), Terms of Use link in the
  App Store description (STORE.md "Subscription rules").
- Real-device check: sandbox purchase + restore on both platforms, the iOS tracking prompt, ad fill.
- Create the TikTok and YouTube accounts @muscle_pal (the Profile rows already link there).

Next steps, in the order to discuss:
1. Whatever the 1.0/1.1 store reviews send back.
2. Real-device results of the purchase/restore/consent check; fix anything found.
3. M8 leftovers (STORE.md checklist): screenshots from a release build (iPhone, iPad, Watch, Android; free
   plan now shows the banner), complications on a watch face and a real watch, VoiceOver/TalkBack and AX
   text sizes, 60 fps on a mid-range Android phone. Web export of the library is optional.
4. Content: new exercises go out with `core/publish.py` + `cd hosting && npx wrangler deploy` in
   fitness-automation (README "Hosting"); prune old release folders well before 20,000 hosted files.
5. Ideas not started: logging from the watch (needs two-way sync), localization.
