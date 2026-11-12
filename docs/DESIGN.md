# Design — dark, lime, bold

Direction (updated 2026-11-03 from the user's reference shots): near-black screens, one
lime accent with black text on it, large rounded dark cards, pill buttons and chips, lime
icon circles, Poppins type, a floating pill tab bar. Our 3D renders (heroes, body map,
exercise loops) are the only imagery: no stock photos, no fake metrics (no calories,
heart rate or steps; we only show what the app really tracks).

## Light and dark

Both schemes live in `src/palettes.ts`; the user picks Automatic (follows the phone), Light or Dark in
onboarding and in Profile. Lime stays the fill colour in both (buttons, selection, the recovery card,
always with black text on it). As text or an icon on a plain surface, light mode uses `accentInk`, a dark
lime green, because lime on white is unreadable. Recovery colours are darker in light mode and their badge
icons turn white (`onState`). Video posters and the dark chips over them (Today badge, video controls) look
the same in both. `tests/contrast.test.ts` holds both palettes to WCAG AA.

How it works: `colors` is one object whose values switch with the scheme; every screen calls
`useScheme()` so it repaints, and style sheets that use colours are built with `themed()` (one sheet per
scheme). Inside Reanimated worklets copy colours into local strings first: a worklet freezes the objects it
captures, which would stop `colors` from switching.

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

## Muscle icons

One icon per muscle (`src/components/MuscleIcon.tsx`): charcoal body, grey outline, the muscle in
lime. They sit directly on dark surfaces, never on lime (the highlight disappears; use a dark
circle behind them). A corner badge adds meaning: recovery state on Home, primary or secondary
on the exercise screen, using the same red and orange as the video highlights.

## Model pictures

Onboarding, the model choice and avatars use `src/components/modelImages.ts` (generated people in
charcoal and lime kit). Exercise videos and the body map keep the 3D models.

## Screens

**Onboarding (4 steps, one decision per screen).** Welcome: both hero renders on a soft lime
glow, "Train with correct form", page dots, lime "Get started" pill with an arrow. "Choose
your model": two tall hero cards, lime outline when selected. "Weight units": two large
radio cards (Kilograms, Pounds). "You're all set": lime check, chips summarising the choices,
a card of what the app does, "Start training" and the privacy link. No account, no quiz, no
paywall.

**Home.** Greeting eyebrow, "Ready to train?", info button and a round avatar of the chosen
model (opens Profile). A lime recovery card (share of muscles ready, which muscles are
resting, progress bar). Two stat tiles: day streak (with the best streak below) and "This
week": training days against the weekly goal ("2 of 3 days", a trophy once met) with a Mon–Sun
bar strip. "Routines": a row per routine (exercises, done today) opening its screen, or a
"Build a routine" card. "Ready to train": up to three exercises whose primary muscles are fully
recovered, rested-longest first, one per muscle, favourites winning ties. "Body map" card with
a Front | Back pill switch, the body render with tinted masks per recovery state and a
legend; tapping a muscle selects it and shows a row linking to its exercises; tapping it
again or outside the body clears the selection. "Muscles"
list (resting muscles first) with state icon circles and exercise counts; tap opens the
filtered library.

**Exercises.** Large title (muscle name or "All exercises"), search field, horizontal chips
for equipment (icons rendered from our equipment). 2-column grid; card = poster on
`bg.video` (4:5), name (2 lines max), equipment in `text.2`, small "+" quick-log button in
the corner (logs "done" with haptic + toast "Logged · Undo"); exercises already logged today
show a small dark "✓ Today" badge on the poster. Starred exercises show a small lime star, and a "Favorites" chip (once anything is starred)
filters to them. A "Clear" pill in the header resets favourites,
equipment and search; the empty state offers "Clear filters" too. Grid never autoplays video.
Search matches at word starts and understands everyday words (legs, arms, back, core, pecs,
quads, delts, db/bb/kb, rdl, ohp), plurals and missing spaces ("push ups"). Exercises with no
equipment count as Bodyweight, in the chip and on the card.
Ad banner (free tier) docked at the bottom above the tab bar, never covering content.

**Exercise detail.** Video full width at the top (4:5, rounded 16), camera angle picker under
it: one card per angle with that angle's own poster thumbnail and a plain name (Angled,
Front, Side, Back, Rear angle, Above, Foot end; spoken hints say where the camera is). Narrow
screens (< 350 pt) and large text stack the name under the thumbnail. The picked angle stays
selected for the next exercise opened in the session. A "0.5×" slow-motion toggle sits beside
play/pause on the video (lime when on; also kept for the session). Title, muscles worked as chips (red primary, orange
secondary) + a mini body thumbnail with those muscles tinted. Sticky bottom bar: a round
timer button (starts the rest timer; its icon is lime while resting) and the big accent
**Log** button. Guide (`src/components/ExerciseGuide.tsx`), always open, one card per
part with a lime icon badge: How to (numbered steps), Cues (lime checks), Common mistakes (red crosses),
Breathing. Common mistakes is a Pro perk: free users see a PRO badge, grey bars shaped like the hidden
lines (the text is not rendered), and "Unlock with Pro". "Your sessions" stays collapsible. Last-done line ("Last: 3 × 10 · 40 kg · Tue"), and
once there are two or more sessions with sets, a best-set line ("Best set: 8 reps · 60 kg").
Close is an X (the header's chevrons are previous/next exercise); a star beside them saves
the exercise to favourites (lime when on). The best-set line adds an Epley one-rep-max estimate
for 1–12-rep sets. With two or more sessions with sets, a "Progress" card charts the last 12
(heaviest set or volume; reps for bodyweight work): columns from zero, at most 24 pt wide with
4 pt rounded tops, earlier sessions gray #6E6E73 (≥ 3:1 on the card), the latest lime, the
first/last dates under a hairline baseline; tap a column to read that session. Barbell
exercises get a collapsible "Plate calculator": total stepper, bar choice (20/15 kg or 45/35 lb)
and the plates per side, drawn to scale. With two or more logs, a
collapsible "Your sessions (n)" section lists the last 10 with grouped set summaries.
Swipe up/down for next/previous exercise; swipe right / X to close. No ads here.

**Log sheet.** Glass bottom sheet. A day stepper on top (Today by default; ‹ goes back a
day, never into the future; editing an entry can move it to another day, keeping its time).
Primary button "Done" (one tap = logged). Expandable
"Add sets": rows of reps × weight with +/− steppers, prefilled from last time, "Add set", and
"Rest 1:30" (the chosen length), which turns into the live countdown in the sheet.
Save → haptic, recovery updates, sheet closes, toast with Undo.

**Routine.** Name, "n exercises · k done today", a lime progress bar, the exercises in order
(poster, name, equipment; a lime check once logged today, else its number) and a sticky
"Start workout" / "Continue" / "All done · Start again" that opens the next undone exercise.
On the exercise screen the header reads "Push day · 2 of 5" and previous/next follow the
routine. Edit and delete (with Undo) in the header. **Routine editor:** name field, "In this
routine (n)" with up/down/remove, and a searchable catalog with add/check toggles; Save is
disabled until there is a name and an exercise; Close asks before discarding changes.

**Rest timer.** One timer for the whole app, derived from timestamps so it stays right after
backgrounding. While it runs, a dark pill floats above the toast lane on every screen: timer
icon, "1:23 rest", "+15 s", "Skip" and a lime line running down. Light haptic ticks at 3-2-1;
at zero a success haptic and a lime "Rest over" pill (OK, or it hides after 5 s); VoiceOver
and TalkBack hear "Rest over". No sound or notification while the app is closed (that needs a
notifications module and a native build). Sheets cover root overlays, so the Log sheet shows
the countdown inline.

**History.** Large title "History". Month calendar card: active days filled accent,
today ringed; stats row below: Active days (month) · Current streak · Weekly streak.
No paging past the current month; a "Today" pill in the header jumps back.
Tap a day → that day's summary (exercises · sets) and entries (poster thumb, name, grouped
sets summary such as "3 × 10 · 40 kg"; bodyweight sets show reps only), swipe to delete,
tap to edit. Below the calendar: "Recent" list of last sessions.

**Profile** (was Settings, renamed 2026-11-03). Header card with the model avatar, the
current choices and totals (logs, active days, exercises tried), then a grouped list: Model
(Male/Female), Units, Recovery speed, Rest timer (0:30 · 1:00 · 1:30 · 2:00 · 3:00), Weekly goal
(2–6 days), Pro
(Remove ads / Restore purchase, later), Export data / Import data / Erase all logs (red; a
confirmation with Export first, then an Undo toast; settings and onboarding stay), Privacy
policy, Credits & licences, Content version, App version.

## Errors

A screen that throws shows a calm error card in place ("Something went wrong", Try again, Close
on stacked screens) instead of crashing; tabs stay usable. A failure in the root layout shows
the same card full screen with Restart. While a downloaded exercise update is running, the
card also offers "Use built-in exercises", which turns that update off and restarts. Unknown
links open a "Page not found" screen with Go to Home.

## Motion and feel

Rules (`src/components/motion.tsx`): Reanimated on the UI thread, transforms and opacity (only
the recovery bar and onboarding dots animate a width), 90–220 ms (600 ms for the recovery bar),
nothing that loops, and no entering/layout animations inside FlashList cells (recycling would
replay them). Reanimated skips all of it when Reduce Motion was on at app start; the tab
cross-fade and the toast countdown are off then too.

- Press feedback: buttons, chips, pills, stat tiles, model and angle cards and grid cards shrink
  slightly while held (`PressableScale` / `usePressScale`) and spring back; list rows keep a
  background highlight instead.
- Segmented controls: the lime pill slides to the chosen segment; label colours follow it.
- Tabs: 150 ms native cross-fade between tabs; the active icon's lime pill grows in.
- Toast: slides up, fades down; a thin lime line counts down the 10 s Undo window.
- Home: the recovery bar eases to its value; Front/Back cross-fades; the muscle row fades in.
- Exercise detail: the info block slides in from the direction of the previous/next move;
  the sessions chevron rotates, content fades in, cards below glide.
- Exercises: the quick-log "+" pops into a check for a moment after logging.
- Log sheet: added sets slide in, removed ones fade out, the note and buttons glide.
- History: months slide in from the side you paged to; the day list fades in; rows glide into
  place after a delete or undo.
- Onboarding: steps slide in from the right (left when going back); page dots stretch; welcome
  content and the "all set" check have one-time entrances.
- Body highlight changes cross-fade 150 ms. Haptics: selection on segmented controls and chips,
  success on Log, warning on delete. The video poster stays until the first frame (no flash).
- Everything works offline.

## Assets

- From fitness-automation (our renders): exercise videos/posters (dark bg), body views and
  muscle masks per model, onboarding hero renders, equipment icons.
- Icons: SF Symbols on iOS via `expo-symbols`, matching Material/lucide on Android.
- ChatGPT images only for: app icon, store screenshot backgrounds, abstract empty-state
  illustrations. Keep them in the same dark/accent style.
