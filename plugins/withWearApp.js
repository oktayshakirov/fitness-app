const { withSettingsGradle, withAppBuildGradle } = require("expo/config-plugins");

module.exports = function withWearApp(config) {
  config = withSettingsGradle(config, (config) => {
    if (!config.modResults.contents.includes("include ':wear'")) {
      config.modResults.contents += "\ninclude ':wear'\nproject(':wear').projectDir = new File(rootDir, '../targets/wear')\n";
    }
    return config;
  });
  // Expo otherwise uses expo.version (shared with iOS), ignoring android.version.
  config = withAppBuildGradle(config, (config) => {
    config.modResults.contents = config.modResults.contents.replace(
      /versionName "[^"]+"/, 'versionName "' + (config.android.version || config.version) + '"'
    );
    return config;
  });
  return config;
};
