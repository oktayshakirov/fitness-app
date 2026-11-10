/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: "widget",
  icon: "../../assets/brand/icon.png",
  deploymentTarget: "16.4",
  colors: {
    $accent: "#C8FA3C",
    $widgetBackground: "#0B0B0C",
  },
  entitlements: {
    "com.apple.security.application-groups": ["group.com.shadev.musclepal"],
  },
};
