# Architecture proposal

Prepared 2026-10-21. This is a recommendation for discussion, not an approved build specification.

## Recommendation

Use Expo, React Native and TypeScript for an iOS/Android app. Use Expo Router for
navigation and expo-video for the approved exercise loops. Pin compatible stable
versions when implementation begins, not during this planning phase.

The existing Blender animations remain pre-rendered videos; the app plays them
through the platform video player. Navigation, controls and workout sessions use
React Native UI. We do not need an interactive 3D engine to deliver the current
experience. If arbitrary camera rotation or real-time body customization becomes
a requirement, reconsider that separately; our existing clips offer fixed views.

Native UI does not prevent frequent content updates. Separate exercise data,
workout definitions and media from app code. A new supported exercise is a content
release. A new screen or workout behavior may need an application update.

## Options

| Approach | Advantages for us | Costs and limitations | Recommendation |
|---|---|---|---|
| Expo / React Native | Mobile navigation and controls, native playback, local storage; one mobile codebase | iOS/Android builds and device QA; a polished public website remains separate work | Best fit if a mobile workout experience is the priority |
| React web app + Capacitor | Share most UI with a full browser app; native plugins available | WebView UI still needs mobile interaction, keyboard, offline and lifecycle testing; not merely pointing at a hosted URL | Prefer if a full browser product is a launch requirement |
| Responsive website / PWA first | Fast browser access and immediate web deployment | Installed mobile experience and platform integration differ; later mobile work remains | Prefer for validating a primarily web audience |
| Separate Swift and Kotlin apps | Full platform control | Two implementations and more maintenance | Unnecessary for the current scope |

This is a project-specific engineering judgment, not a measured performance
comparison. There is no existing fitness web application to reuse, so a wrapper
has no automatic head start. Both Expo and Capacitor can play these short videos.
For a simple exercise directory, a website may be fastest; for a mobile workout
product, Expo is the proposed starting point. Feature references may change this.

Capacitor packages web UI with a native runtime and plugins. Vercel/Netlify can
host the browser version and data; mobile distribution still requires native
packaging and store submission. Apple's minimum-functionality rule applies to
all architectures: a wrapper is not automatically rejected or accepted.

## Boundaries

- `fitness-automation`: exercise content, Blender source, rendering, visual QA,
  approval and versioned media exports. Remains the source of truth for exercises.
- `fitness-app`: mobile UI, content import/validation, player, local state and
  any later workout engine. Workout definitions may start as versioned JSON here;
  avoid turning the Blender project into an application backend.
- `fitness-blog`: deferred. If approved, a separate static/SEO website with articles,
  landing pages and links into the app. It can consume the same published exercise
  data. A blog and a full web workout app are different scope decisions.

No accounts, database vendor, payments, analytics or cloud sync are chosen yet.
Start local-first unless confirmed requirements need a backend. Keep repository
code private initially; preserve attribution when publishing derivative assets.

## Hosting and domains

A mobile app does not require buying a custom domain to start. Bundle the initial
exercise library; later serve approved content from HTTPS static storage/CDN.
Use a provider URL initially, with the content base URL configurable. Vercel and
Netlify supply deployment subdomains for any future site. Choose the provider and
plan after checking intended commercial use, transfer limits and expected traffic.
Do not assume free website hosting means unlimited video delivery.

A small support/privacy website may eventually be needed for distribution; it
need not become a full blog or web application. App-store accounts/build services
have separate cost considerations from domains; budget after platform scope is chosen.

## Sources

Official documentation reviewed 2026-10-21:
- [Expo video: playback and caching](https://docs.expo.dev/versions/latest/sdk/video/)
- [Expo runtime compatibility and updates](https://docs.expo.dev/eas-update/runtime-versions/)
- [Capacitor architecture and platform access](https://capacitorjs.com/docs)
- [Apple review guidelines, including 4.2](https://developer.apple.com/app-store/review/guidelines/)
- [Vercel generated deployment URLs](https://vercel.com/docs/deployments/generated-urls)
- [Netlify default subdomains](https://docs.netlify.com/manage/domains/domains-fundamentals/understand-domains/)
