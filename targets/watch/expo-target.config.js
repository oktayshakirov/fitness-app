/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: "watch",
  name: "MusclePalWatch",
  displayName: "Muscle Pal",
  icon: "../../assets/brand/icon.png",
  deploymentTarget: "10.0",
  colors: {
    $accent: "#C8FA3C",
  },
  entitlements: {
    "com.apple.security.application-groups": ["group.com.shadev.musclepal"],
  },
};
