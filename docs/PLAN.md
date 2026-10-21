# Decisions and next steps

## Confirmed by the user

- The current 30 exercise animations are approved; revisions may follow later.
- Preserve a versioned approved release before starting the app.
- Create fitness-app and plan architecture now; implementation comes later.
- User will supply screenshots and specific features before UI/product scope is fixed.
- Prefer provider subdomains initially; a custom domain and full web version are undecided.

## Proposed, awaiting discussion

| Decision | Recommendation | When to revisit |
|---|---|---|
| Primary platform | Expo/React Native for iOS and Android | If browser access is a launch requirement |
| Exercise visuals | Existing loops in a native video player | If interactive 3D becomes required |
| Content delivery | Bundled initial library, versioned remote releases later | After on-device playback/offline prototype |
| Data persistence | Local-first with a migration-friendly storage layer | Once accounts/sync requirements are known |
| Blog/web repository | Defer fitness-blog | When SEO, articles or browser product has confirmed scope |
| Domains | Provider URLs first | Branding, public launch or integration needs justify purchase |

## Discussion order

1. Is the launch primarily a mobile workout app, or must people use the full product
   in a browser? Recommended starting point: mobile first.
2. After screenshots arrive, identify the central job: exercise reference, guided
   workouts, workout logging, or a combination. Rank launch requirements versus later ideas.
3. Decide whether accounts/cross-device sync, offline workouts, paid access and user-
   created routines are needed at launch. These drive data and backend architecture.
4. Agree navigation, core journeys and a small first release. Then choose libraries,
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
