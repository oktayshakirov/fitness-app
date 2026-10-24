# Design — clean, dark, fast

Direction: Apple Fitness / Health. True black, generous spacing, large titles, one
accent, the 3D body and the exercise videos are the only "rich" visuals. Subtle glass
on the tab bar and sheets. Nothing loud: no gradients-for-the-sake-of-it, no stock
fitness photos, no aggressive upsell.

## Tokens (start here; tune on device)

| Token | Value | Use |
|---|---|---|
| `bg` | `#000000` | screens |
| `bg.video` | `#0A0A0C` | background colour baked into every exercise render; cards that hold videos/posters use exactly this |
| `surface` | `#1C1C1E` | cards, list groups |
| `surface.2` | `#2C2C2E` | chips, inputs, pressed states |
| `separator` | `rgba(84,84,88,0.6)` | hairlines |
| `text` / `text.2` / `text.3` | `#FFFFFF` / `#EBEBF5 @60%` / `@30%` | primary / secondary / tertiary |
| `accent` | `#30D158` | Log button, selection, links (fitness green) |
| `trained` | `#FF453A` | recovery: trained (matches the red "primary" in videos) |
| `recovering` | `#FF9F0A` | recovery: recovering (matches the orange "secondary") |
| `almost` | `#FFD60A` | almost ready |
| `ready` | `#3A3A3C` body tint / `#30D158` text | ready |
| radius | 12 (chips), 16 (cards), 24 (sheets) | |
| spacing | 4-pt grid; screen padding 16/20 | |
| type | system font (SF Pro / Roboto): Large Title 34 bold, Title 22 semibold, Body 17, Footnote 13 | |

Dynamic Type up to XL without layout breakage; contrast AA; hit targets ≥ 44 pt.

## Navigation

Bottom tab bar (blurred glass, 3 tabs + settings in the header):
**Body** (home) · **Exercises** · **History**. Settings = gear in the Body header.
Exercise detail and Log sheet are presented above tabs.

## Screens

**Onboarding — Choose your model.** Black, title "Choose your model", subtitle "You can
change this anytime". Two tall cards side by side (our male / female hero renders on
`bg.video`), label below. Selecting = accent outline + haptic, then "Continue". Optional
units step. Link to privacy in footnote. No account, no quiz, no paywall.

**Body (home).** Header: large title "Body", gear icon. Segmented control **Front | Back**
(auto-switches when the focused muscle is on the other side). Body view takes ~55% of the
height: base render + tinted muscle masks by recovery state; the focused muscle pulses
softly (accent outline glow). Small legend row: Trained · Recovering · Almost · Ready.
Below: vertical list (glass/surface rows) of muscle groups: name, status ("Recovering —
ready in ~20 h"), 2 example exercises in `text.2`, chevron. Scrolling sets the focused row
(the one under the body's bottom edge) → highlights it on the body. Tap row (or the muscle
on the body) → Exercises filtered by that muscle. Top of list: "All exercises" row.
Empty first-run state: everything "Ready" + a hint "Log an exercise to see recovery".

**Exercises.** Large title (muscle name or "All exercises"), search field, horizontal chips
for equipment (icons rendered from our equipment). 2-column grid; card = poster on
`bg.video` (4:5), name (2 lines max), equipment in `text.2`, small "+" quick-log button in
the corner (logs "done" with haptic + toast "Logged · Undo"). Grid never autoplays video.
Ad banner (free tier) docked at the bottom above the tab bar, never covering content.

**Exercise detail.** Video full width at the top (4:5, rounded 16), view switcher pills
(Front · Side · ¾) under it. Title, muscles worked as chips (red primary, orange
secondary) + a mini body thumbnail with those muscles tinted. Big accent **Log** button
(sticky at the bottom). Sections: How to (numbered steps), Cues, Common mistakes,
Breathing — collapsible, first one open. Last-done line ("Last: 3 × 10 · 40 kg, Tue").
Swipe up/down for next/previous exercise; swipe right / X to close. No ads here.

**Log sheet.** Glass bottom sheet. Primary button "Done" (one tap = logged). Expandable
"Add sets": rows of reps × weight with +/− steppers, prefilled from last time, "Add set".
Save → haptic, recovery updates, sheet closes, toast with Undo.

**History.** Large title "History". Month calendar card: active days filled accent,
today ringed; stats row below: Active days (month) · Current streak · Weekly streak.
Tap a day → list of that day's entries (poster thumb, name, sets summary), swipe to delete,
tap to edit. Below the calendar: "Recent" list of last sessions.

**Settings.** Grouped inset list: Model (Male/Female), Units, Recovery speed, Pro
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
