const path = require('path');
const { defineConfig } = require('@playwright/test');
const { getViewport } = require('./helpers/viewports');

const repositoryRoot = path.resolve(__dirname, '../..');
const baseURL = 'http://[::1]:3000';
const javaScriptOnlyTests = [
  '**/demo-casework-enhancements.test.js',
  '**/demo-shared-components.test.js',
  '**/demo-support-accessibility.test.js',
  '**/demo-support-enhancements.test.js',
];

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: ['**/*.browser.js', '**/*.test.js'],
  outputDir: path.join('/tmp', 'govuk-component-demo-playwright-results'),
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    headless: true,
    viewport: getViewport('desktop'),
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-js',
      testIgnore: ['**/*-no-js.test.js'],
      use: { browserName: 'chromium', javaScriptEnabled: true },
    },
    {
      name: 'chromium-no-js',
      testIgnore: javaScriptOnlyTests,
      use: { browserName: 'chromium', javaScriptEnabled: false },
    },
  ],
  webServer: {
    command: 'node tests/browser/support/test-server.js',
    cwd: repositoryRoot,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: '3000',
      SESSION_SECRET: 'browser-test-session-secret',
    },
    url: `${baseURL}/start`,
    reuseExistingServer: false,
    timeout: 30_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
