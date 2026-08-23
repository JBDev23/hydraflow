const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Forces CMake to hash long object paths on Windows (MAX_PATH / ninja Stat failures).
 * Complements android.cmakeVersion=3.31.6 (Ninja 1.12+) from expo-build-properties.
 */
function withWindowsCmakeObjectPath(config) {
  if (process.platform !== 'win32') {
    return config;
  }

  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }

    const marker = 'CMAKE_OBJECT_PATH_MAX';
    if (config.modResults.contents.includes(marker)) {
      return config;
    }

    const injection = `
        // Windows: shorten CMake object paths to avoid ninja MAX_PATH (260) failures
        externalNativeBuild {
            cmake {
                arguments "-D${marker}=128"
            }
        }
`;

    // Inject into the existing defaultConfig { ... } block
    if (config.modResults.contents.includes('defaultConfig {')) {
      config.modResults.contents = config.modResults.contents.replace(
        /defaultConfig\s*\{/,
        `defaultConfig {${injection}`,
      );
    }

    return config;
  });
}

module.exports = withWindowsCmakeObjectPath;
