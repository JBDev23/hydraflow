const appJson = require('./app.json');

const WINDOWS_CMAKE_PLUGIN = './plugins/withWindowsCmakeObjectPath';

/** @returns {import('expo/config').ExpoConfig} */
module.exports = () => {
  const expo = {
    ...appJson.expo,
    plugins: [
      ...appJson.expo.plugins,
      ['./plugins/withAndroidNavigationBarColor.js', { color: '#6989E2' }],
    ],
  };

  // CMake 3.31.6 + short object paths are only needed for local Windows native builds.
  // EAS/Linux agents do not ship that CMake version ([CXX1300] if forced globally).
  if (process.platform === 'win32') {
    expo.plugins.push(
      [
        'expo-build-properties',
        {
          android: {
            cmakeVersion: '3.31.6',
          },
        },
      ],
      WINDOWS_CMAKE_PLUGIN,
    );
  }

  return { expo };
};
