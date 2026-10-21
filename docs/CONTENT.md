# Content and update plan

Proposed design; no importer, updater or runtime schema has been implemented.

## Existing approved input

Release `v0.1.0` has 30 approved exercises, 176 H.264/HEVC videos, 88 WebP posters
and 30 thumbnails. Media and posters total 9,066,004 bytes; the complete dist folder
is about 10 MB. It is small enough to consider bundling all initial content.

The release preserves:
- `dist/manifest.json`: currently a JSON array; paths resolve relative to `dist/`.
- `catalog/<id>.json`: steps, cues, common mistakes, breathing, muscles and equipment.
  The media manifest alone does not contain all instructional text.
- `bodymap/`: SVG muscle regions, image alternatives, metadata and licensing.
- `approvals/`: version-bound review records; `motion/specs/` for traceability.
- `RELEASE.json`, `SHA256SUMS.json` and attribution documents.

The archive is stored outside the rendering workspace. The accompanying local
Blender backup is for maintenance, not for shipping in the app. See MEDIA_RELEASE.json
for the source commit and archive hashes. Local archives are not offsite backups.

## App-facing adapter

Build a small validated adapter after architecture approval. Keep the original
pipeline manifest intact. The adapter joins catalog and media by stable exercise ID,
validates approved status and all referenced files, normalizes muscle IDs and
preserves source/licence credits. Include asset dimensions, format, byte count and
SHA-256. Use H.264 as the broad compatibility baseline; HEVC is an optional device-
tested alternative. Do not bundle both codecs merely because both are exported.

Proposed future envelope: schemaVersion, contentVersion, minimumSupportedAppVersion,
exercises, bodymap and attribution. These are proposed fields, not existing output.
Separate content versions from schema versions and binary app versions.
Workout definitions should reference stable exercise IDs; their eventual schema
(repetitions, duration, rests, supersets, etc.) depends on the feature discussion.
New workout modes may require app code even when the definitions are data.

## Update flow

1. Revise/add an exercise in fitness-automation using the documented CLI workflow.
2. Render only affected exercises; run QA; review and approve their exact versions.
3. Audit and create a new immutable release, retaining the previous release.
4. Validate the app adapter output; upload assets first under versioned paths.
5. Publish the small current-release pointer last, after verifying downloads.
6. App checks compatible metadata, downloads needed files and verifies hashes.
7. Activate the complete update atomically between workout sessions. Keep the last
   working release and bundled fallback. Unsupported schemas remain on known-good content.
8. Roll back the pointer if necessary; do not replace files under immutable URLs.

Changed filenames/hashes invalidate affected cached assets only. Release delivery
must be authenticated by the publishing service and use HTTPS; checksums catch
corruption but are not proof of publisher identity. Keep a usable cache when offline
or when an update is incomplete. Preserve retired exercise IDs referenced in history.

Initial prototype: bundle the approved library and validate on real iOS/Android
devices. Later add remote content updates behind the same content interface.
Player caching helps repeated playback, but cache eviction means it is not a promise
of permanent offline availability. Explicit offline packs need managed file storage,
space checks, a delete/download UI and tests for interrupted downloads.

## What requires which release?

| Change | Expected delivery |
|---|---|
| Correct a clip, steps or muscle tags | Approved content release |
| Add an exercise using supported fields | Approved content release |
| Add a workout using supported session behaviors | Workout/content release |
| Change screens, timer logic or content schema support | App code update; compatible EAS Update where appropriate |
| Add/change native modules or platform permissions | New native build and applicable store review |

EAS Update and exercise-content delivery are separate mechanisms. Updates must
match the native runtime and comply with platform rules; data delivery is not a
way to introduce arbitrary new executable behavior without application review.
