# Design — dark, lime, bold

Direction (updated 2026-11-03 from the user's reference shots): near-black screens, one
lime accent with black text on it, large rounded dark cards, pill buttons and chips, lime
icon circles, Poppins type, a floating pill tab bar. Our 3D renders (heroes, body map,
exercise loops) are the only imagery: no stock photos, no fake metrics (no calories,
heart rate or steps; we only show what the app really tracks).

## Tokens (`src/theme.ts`)

| Token | Value | Use |
|---|---|---|
| `bg` | `#0B0B0C` | screens |
| `surface` / `surface2` / `surface3` | `#1A1A1C` / `#252528` / `#323236` | cards, chips and inputs, pressed |
| `separator` | `rgba(255,255,255,0.08)` | hairlines, chip borders |
| `text` / `secondary` / `tertiary` | `#FFFFFF` / `#EBEBF5 @62%` / `@32%` | |
| `accent` / `onAccent` | `#C8FA3C` / `#0B0B0C` | primary buttons, selection, hero card, links; text on lime is black |
| `trained` / `recovering` / `almost` / `ready` | `#FF4D3D` / `#FF9F0A` / `#FFD60A` / lime | recovery states (red/orange match the video highlights) |
| `bg.video` | `#FFFFFF` | baked into every exercise render; posters and videos sit in white rounded cards |
| radius | 22 chips, 24 cards and media, 30 pills | |
| type | Poppins 400/500/600/700 via `src/components/Text.tsx`: large 30, title 20, body 16, footnote 13 | |

Dynamic Type up to XL without layout breakage; contrast AA; hit targets ≥ 44 pt.

## Navigation

Floating pill tab bar (blur on iOS, solid surface on Android), 4 tabs: **Home** · **Exercises**
· **History** · **Profile**. The active tab is a lime pill behind the icon. Screens reserve
`tabBarSpace` at the bottom.
Exercise detail and Log sheet are presented above tabs.

## Screens

**Onboarding (4 steps, one decision per screen).** Welcome: both hero renders on a soft lime
glow, "Train with correct form", page dots, lime "Get started" pill with an arrow. "Choose
your model": two tall hero cards, lime outline when selected. "Weight units": two large
radio cards (Kilograms, Pounds). "You're all set": lime check, chips summarising the choices,
a card of what the app does, "Start training" and the privacy link. No account, no quiz, no
paywall.

**Home.** Greeting eyebrow, "Ready to train?", info button and a round avatar of the chosen
model (opens Profile). A lime recovery card (share of muscles ready, which muscles are
resting, progress bar). Two stat tiles: day streak (with the best streak below) and training
days this week (distinct days with a log, plus a Mon–Sun bar strip). "Body map" card with
a Front | Back pill switch, the body render with tinted masks per recovery state and a
legend; tapping a muscle selects it and shows a row linking to its exercises; tapping it
again or outside the body clears the selection. "Muscles"
list (resting muscles first) with state icon circles and exercise counts; tap opens the
filtered library.

**Exercises.** Large title (muscle name or "All exercises"), search field, horizontal chips
for equipment (icons rendered from our equipment). 2-column grid; card = poster on
`bg.video` (4:5), name (2 lines max), equipment in `text.2`, small "+" quick-log button in
the corner (logs "done" with haptic + toast "Logged · Undo"); exercises already logged today
show a small dark "✓ Today" badge on the poster. A "Clear" pill in the header resets muscle,
equipment and search; the empty state offers "Clear filters" too. Grid never autoplays video.
Ad banner (free tier) docked at the bottom above the tab bar, never covering content.

**Exercise detail.** Video full width at the top (4:5, rounded 16), camera angle picker under
it: one card per angle with that angle's own poster thumbnail and a plain name (Angled,
Front, Side, Back, Rear angle, Above, Foot end; spoken hints say where the camera is). Narrow
screens (< 350 pt) and large text stack the name under the thumbnail. The picked angle stays
selected for the next exercise opened in the session. Title, muscles worked as chips (red primary, orange
secondary) + a mini body thumbnail with those muscles tinted. Big accent **Log** button
(sticky at the bottom). Sections: How to (numbered steps), Cues, Common mistakes,
Breathing — collapsible, first one open. Last-done line ("Last: 3 × 10 · 40 kg · Tue"), and
once there are two or more sessions with sets, a best-set line ("Best set: 8 reps · 60 kg").
Close is an X (the header's chevrons are previous/next exercise).
Swipe up/down for next/previous exercise; swipe right / X to close. No ads here.

**Log sheet.** Glass bottom sheet. A day stepper on top (Today by default; ‹ goes back a
day, never into the future; editing an entry can move it to another day, keeping its time).
Primary button "Done" (one tap = logged). Expandable
"Add sets": rows of reps × weight with +/− steppers, prefilled from last time, "Add set".
Save → haptic, recovery updates, sheet closes, toast with Undo.

**History.** Large title "History". Month calendar card: active days filled accent,
today ringed; stats row below: Active days (month) · Current streak · Weekly streak.
No paging past the current month; a "Today" pill in the header jumps back.
Tap a day → that day's summary (exercises · sets) and entries (poster thumb, name, grouped
sets summary such as "3 × 10 · 40 kg"; bodyweight sets show reps only), swipe to delete,
tap to edit. Below the calendar: "Recent" list of last sessions.

**Profile** (was Settings, renamed 2026-11-03). Header card with the model avatar, the
current choices and totals (logs, active days, exercises tried), then a grouped list: Model (Male/Female), Units, Recovery speed, Pro
(Remove ads / Restore purchase), Export data / Import data, Privacy policy, Credits &
licences, Content version, App version.

## Motion and feel

- Spring transitions (native stack); shared-element feel from grid poster → detail video
  (poster stays visible until the video's first frame, so no flash).
- Body highlight changes cross-fade 150 ms; no jank while the list scrolls (driven on the
  UI thread with Reanimated).
- Haptics: selection on segmented control, success on Log.
- Everything works offline.

## Assets

- From fitness-automation (our renders): exercise videos/posters (dark bg), body views and
  muscle masks per model, onboarding hero renders, equipment icons.
- Icons: SF Symbols on iOS via `expo-symbols`, matching Material/lucide on Android.
- ChatGPT images only for: app icon, store screenshot backgrounds, abstract empty-state
  illustrations. Keep them in the same dark/accent style.
