const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = defineConfig([
  globalIgnores([
    'node_modules/',
    '.expo/',
    'dist/',
    'web-build/',
    'coverage/',
    'android/',
    'ios/',
    '*.tsbuildinfo',
  ]),
  expoConfig,
  eslintConfigPrettier,
  {
    files: ['jest.config.js'],
    languageOptions: { sourceType: 'commonjs' },
  },
]);
