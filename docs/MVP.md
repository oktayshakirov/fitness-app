# App MVP (Phase 4) — scope, architecture, milestones

Agreed with Oktay on 2026-10-22. This supersedes the "awaiting discussion" items in
PLAN.md where they conflict. Screenshots/references may refine the UI later; the
structure below is fixed enough to start building.

## Product (MVP)

1. **Home: body map.** Front/back body (toggle or swipe). Every muscle region is
   tappable → that muscle's exercise list. An **"All exercises"** button. A plain
   muscle list as an accessible alternative (tiny regions, screen readers).
2. **Exercise list.** Filtered by the tapped muscle (primary first, then secondary),
   with equipment chips (barbell, dumbbell, cable, machine, bodyweight, kettlebell)
   and a search field. Each row: thumbnail, name, primary muscles, equipment.
3. **Exercise screen.** The looping video (poster first, then seamless loop), a view
   switcher (front / side / ¾ where available), muscles worked (red = primary,
   orange = secondary, same colours as the animation), then steps, cues, common
   mistakes, breathing. Swipe up/down moves to the next/previous exercise in the
   current list (TikTok-style feed); only the visible video plays.
4. **About/credits.** Z-Anatomy (CC BY-SA), MPFB, free-exercise-db credits from
   `ATTRIBUTION.md`; privacy note; content version.

Out of MVP (later decisions): accounts, sync, workouts/timers, logging, payments,
analytics, notifications, social-video exports (done in fitness-automation).

Feel: light, fast, calm. Light theme first (videos are rendered on the light app
background colour), dark theme later with dark-background renders.

## Architecture

- **Expo (latest stable SDK) + TypeScript + Expo Router.** One codebase for iOS,
  Android and **web** (`expo export --platform web`, static). The web build is a
  bonus target, not a separate product: same screens, same content.
- **Video:** `expo-video` (`VideoView`, `loop`, `muted`, `contentFit="contain"`),
  poster `expo-image` underneath until the first frame renders. Feed: `FlatList`
  with paging, play only the item in view, pause on blur/background, keep at most
  the current ±1 players alive. H.264 only in the app (HEVC is not shipped).
- **Body map:** `react-native-svg` rendering `bodymap/front.svg` / `back.svg`
  (`<path data-muscle=...>`) over the WebP underlay; hit-testing per path;
  highlight on press.
- **State:** content in a typed in-memory store loaded from the active content
  release; favourites/recents (if added) in local storage. No backend.
- **Code updates:** EAS Update for JS/asset changes; store builds only for native
  changes.

## Content: add/fix exercises without an app release

Content lives outside the app binary and is replaceable at runtime.

- **Envelope (new, produced by fitness-automation `core/publish.py`):**
  `releases/<contentVersion>/content.json` with `schemaVersion`, `contentVersion`,
  `minAppSchema`, `exercises[]` (catalog text + muscles + equipment + media paths,
  dimensions, bytes, sha256), `bodymap`, `attribution`. Media under the same
  immutable versioned folder. `current.json` = pointer to the active release.
  Publish order: upload release folder → verify → update `current.json` last.
- **App behaviour:** ships with the bundled v0.1.0 release (offline first launch).
  On launch/foreground (throttled), fetch `current.json`; if newer and
  `minAppSchema` is supported, download `content.json` and the thumbnails/posters;
  videos download lazily when first viewed and are cached on disk
  (`expo-file-system`), verified by sha256. Switch releases atomically; keep the
  previous release + bundled fallback; ignore unknown fields; never crash on a bad
  release (stay on the last good one).
- **Hosting:** static files on **Cloudflare Pages** (free, commercial use allowed,
  unlimited bandwidth, `*.pages.dev` subdomain), e.g. project `fitness-content`.
  Netlify free is the fallback (100 GB/month). Not Vercel Hobby: its free plan is
  non-commercial. Base URL is one config value so moving to R2/a custom domain later
  is a one-line change. The web build can deploy to a second Pages project.

## Milestones (each ends with a device check on iPhone + Android)

- **M1 Scaffold + player.** Expo app, Router tabs/stack, content types, bundled
  v0.1.0 import (adapter from `dist/manifest.json` + `catalog/` until publish.py
  exists), one exercise screen with looping video + poster. Accept: smooth loop,
  no flash between loops, view switcher works.
- **M2 Body map + lists.** Front/back map, tap → filtered list, All, muscle list,
  search + equipment filter. Accept: every muscle with exercises navigates
  correctly; regions without exercises show an empty state, not a crash.
- **M3 Feed + polish.** Vertical paging between exercises, play-in-view only,
  backgrounding, loading/error states, About/credits, app icon/splash, light theme
  polish, accessibility labels.
- **M4 Remote content.** `current.json` check, download/verify/activate, rollback,
  cache management. Accept: publish a new test exercise from fitness-automation and
  it appears in the installed app without a new build; a broken release is ignored.
- **M5 Web + distribution prep.** Web export on Cloudflare Pages, EAS build profiles,
  store metadata, privacy page. Store submission only after Oktay confirms.

## Two agents

| Agent | Repo | Owns |
|---|---|---|
| **App** | `fitness-app` | everything in this document except publishing |
| **Content** | `fitness-automation` | `core/publish.py` (envelope + immutable release folder + `current.json`), Cloudflare Pages content project setup instructions, H.264-only app export, new exercises/revisions, later 9:16 social exports |

The contract between them is the content envelope above; changes to it bump
`schemaVersion` and are written into this file first. Until `publish.py` exists the
App agent reads the v0.1.0 release directly through a small adapter.

## Rules

- Correct, clear exercise visuals and text come first; nothing unapproved ships.
- Keep attribution visible in-app (Z-Anatomy CC BY-SA).
- No accounts/payments/analytics/hosting projects without Oktay's go-ahead;
  creating the Cloudflare Pages project and store submissions need his confirmation.
- Commits: plain messages, no AI attribution lines.
