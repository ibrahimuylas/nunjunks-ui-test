const fs = require('node:fs');
const path = require('node:path');

const packageLock = require('../../package-lock.json');
const {
  demoComponentCoverage,
} = require('../../src/app/config/demo-component-coverage');

const expectedGovukFrontendVersion = '5.14.0';
const govukFrontendPackagePath = require.resolve('govuk-frontend/package.json');
const govukFrontendPackage = require(govukFrontendPackagePath);
const govukFrontendComponentsPath = path.join(
  path.dirname(govukFrontendPackagePath),
  'dist',
  'govuk',
  'components',
);

const installedComponentNames = fs
  .readdirSync(govukFrontendComponentsPath, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

describe('demo component coverage register', () => {
  test('uses the lockfile-resolved GOV.UK Frontend 5.14.0 package', () => {
    expect(packageLock.packages['node_modules/govuk-frontend'].version).toBe(
      expectedGovukFrontendVersion,
    );
    expect(govukFrontendPackage.version).toBe(expectedGovukFrontendVersion);
  });

  test('maps every installed component exactly once in component-directory order', () => {
    const registeredComponentNames = demoComponentCoverage.map(({ component }) => component);

    // Keep uniqueness explicit: an ordered equality failure alone can obscure a
    // duplicate that also displaced a required component.
    expect(new Set(registeredComponentNames).size).toBe(registeredComponentNames.length);
    expect(registeredComponentNames).toEqual(installedComponentNames);
  });

  test.each(demoComponentCoverage)(
    '$component maps to a demo route, state and intended selector or landmark',
    (entry) => {
      expect(entry.route).toMatch(/^\/demo(?:[/?]|$)/);
      expect(entry.state).toEqual(expect.any(String));
      expect(entry.state.trim()).not.toBe('');

      const renderEvidence = entry.selector || entry.landmark;
      expect(renderEvidence).toEqual(expect.any(String));
      expect(renderEvidence.trim()).not.toBe('');
    },
  );
});
