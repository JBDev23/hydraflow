const { createDefaultPreset } = require('ts-jest');

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  // Integration tests share one Postgres DB; parallel workers race on the same user.
  maxWorkers: 1,
  transform: {
    ...tsJestTransformCfg,
  },
};
