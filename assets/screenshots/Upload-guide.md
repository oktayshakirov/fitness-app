# Muscle Pal — store screenshots

Updated 12 November 2026. Black theme, Muscle Pal lime (#C8FA3C), real app captures with marketing headlines and selected detail crops. No UI implementation changes.

## Upload folders

| Folder | Pixels | Count |
| --- | --- | --- |
| Apple/iPhone | 1206 × 2622 | 8 |
| Apple/iPad | 2064 × 2752 | 8 |
| Apple/Apple-Watch | 416 × 496 | 3 |
| Google-Play/Phone | 1080 × 1920 | 8 |
| Google-Play/Tablet-7-inch | 1200 × 1600 | 8 |
| Google-Play/Tablet-10-inch | 1800 × 2400 | 8 |

Only one iPhone size is included: 1206 × 2622 portrait, matching the screenshot size accepted by your selected App Store upload slot. Upload these PNGs as screenshots, not app-preview videos. iPad uses the accepted 13-inch 2064 × 2752 portrait slot. Android tablet exports share the exact iPad composition, resized proportionally at the same 3:4 ratio, with OS status bars removed. These tablet dimensions meet Google Play's dimension limits; 3:4 is valid, although Google recommends 9:16/16:9 for promotional eligibility. Android phone uses Android captures except the shared widget and logging feature crops described below. Upload the numbered files in order; never upload Preview.png.

The eight-page sequence is: muscle recovery, male exercise form, Home Screen widget, workout logging, exercise library, home dashboard, training history, model preferences. All phone and tablet groups have the same subjects and order. Apple Watch includes three native recovery states: overview, fully ready, and recovery with a training streak. No Wear OS screenshots are supplied.

Google-Play also contains the existing 1024 × 500 feature graphic and 512 × 512 app icon. Screenshots are RGB PNG without alpha. The icon is RGBA PNG.

## Capture provenance

Real local app captures from iPhone 17 Pro Max, iPad Pro 13-inch, and the Android development emulator. Male exercise views and the first Watch capture are retained from the original capture pass. Two additional Watch states use temporary sample data in the native companion. Female views, model preferences, home, recovery, library, history, and logs were recaptured. Workout history uses demonstration data. The capture databases were backed up; no application source code was changed.

The recovery hero is an AI-generated male marketing illustration, created with the built-in image generation tool from the app model and the previous poster. It improves facial features, anatomical definition, and recovery overlays. It is not a literal screenshot of the in-app renderer. Coral indicates trained, amber recovering, yellow almost ready, and lime ready. The reusable transparent original is Artwork/recovery-male.png. The current in-app body renderer remains unchanged.

Other panels preserve real UI with OS chrome cropped out. Tablet side gutters are cropped to improve content visibility; content is scaled proportionally, never stretched. App demonstration videos have white backgrounds in the actual app even in black theme.

Source-captures contains the selected originals, and Assets.json lists upload screenshots only. Preview.png and Preview-Android.png are review sheets, not upload assets. Compare with the signed release build before submission, since captures were taken in local development shells.

## Sources

- [Apple screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)
- [Google Play preview asset requirements](https://support.google.com/googleplay/android-developer/answer/9866151)
- [SmartGym listing reviewed for visual direction](https://apps.apple.com/us/app/smartgym-gym-home-workouts/id922744883)


## Typography revision
All 40 composed phone/tablet images have no top app-brand label or page numbers. Benefit headlines and descriptive subtitles are larger. Native app UI, including the title inside unmodified Watch screenshots, is preserved.


## Widget revision
Page 03 features native iOS widget gallery previews with the built-in example data (82% recovered and a 4-day streak). The small and medium preview crops are shared in the marketing artwork across phone/tablet platforms; Android widget styling differs slightly. Widgets require Muscle Pal Pro, stated on the artwork. Page 04 retains the native side-view Dumbbell Curl logging capture, shared across formats with OS chrome excluded. The repetitive female form page remains removed; model preferences still show both models. Watch retains three native screenshots.

## Footer cleanup
Removed the FORM / LOG / RECOVER breadcrumb footer from every phone and tablet screenshot. Watch screenshots have no editorial breadcrumb footer. Refreshed both contact sheets. Upload dimensions and page order are unchanged.
