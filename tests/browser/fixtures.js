const base = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const WCAG_TAGS = Object.freeze(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']);

function describeConsoleMessage(message) {
  const location = message.location();
  const source = location.url
    ? `${location.url}:${location.lineNumber + 1}:${location.columnNumber + 1}`
    : 'unknown source';

  return `console.${message.type()}: ${message.text()} (${source})`;
}

const test = base.test.extend({
  browserErrorGuard: [
    async ({ page }, use) => {
      const errors = [];

      page.on('console', (message) => {
        errors.push(describeConsoleMessage(message));
      });
      page.on('pageerror', (error) => {
        errors.push(`pageerror: ${error.stack || error.message}`);
      });

      await use();

      base.expect(errors, `Unexpected browser console or page output:\n${errors.join('\n')}`).toEqual([]);
    },
    { auto: true },
  ],
  makeAxeBuilder: async ({ page }, use) => {
    await use(() => new AxeBuilder({ page }).withTags(WCAG_TAGS));
  },
});

module.exports = { expect: base.expect, test, WCAG_TAGS };
