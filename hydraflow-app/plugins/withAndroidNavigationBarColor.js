const { withAndroidStyles, AndroidConfig } = require('@expo/config-plugins');

/** Sets the native Android navigation bar color during prebuild. */
function withAndroidNavigationBarColor(config, { color = '#6989E2' } = {}) {
  return withAndroidStyles(config, (config) => {
    config.modResults = AndroidConfig.Styles.assignStylesValue(config.modResults, {
      add: true,
      name: 'android:navigationBarColor',
      value: color,
      parent: AndroidConfig.Styles.getAppThemeGroup(),
    });

    config.modResults = AndroidConfig.Styles.assignStylesValue(config.modResults, {
      add: true,
      name: 'android:windowLightNavigationBar',
      value: 'false',
      parent: AndroidConfig.Styles.getAppThemeGroup(),
    });

    return config;
  });
}

module.exports = withAndroidNavigationBarColor;
