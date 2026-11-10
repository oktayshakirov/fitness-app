/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: "watch-widget",
  name: "MusclePalComplication",
  // Must sit under the watch app's bundle ID (com.shadev.musclepal.watch). Apple refused to register
  // ".watch.complication" (as "not available") for both com.shadev.musclepal and com.shadev.mymusclepal.
  bundleIdentifier: ".watch.widget",
  deploymentTarget: "10.0",
  colors: {
    $accent: "#C8FA3C",
  },
  entitlements: {
    "com.apple.security.application-groups": ["group.com.shadev.musclepal"],
  },
};
