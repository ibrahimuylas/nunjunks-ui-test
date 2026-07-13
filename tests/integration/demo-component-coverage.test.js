const { demoComponentCoverage } = require('../../src/app/config/demo-component-coverage');
const { renderDemoComponentState } = require('../helpers/demo-component-states');

const item26ComponentNames = [
  'accordion',
  'back-link',
  'breadcrumbs',
  'button',
  'character-count',
  'checkboxes',
  'cookie-banner',
  'date-input',
  'details',
  'error-message',
  'error-summary',
  'exit-this-page',
];

const item26Coverage = demoComponentCoverage.slice(0, item26ComponentNames.length);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function expectRegisteredClass(html, selector) {
  expect(selector).toMatch(/^\.[a-z0-9-]+$/);
  const className = escapeRegExp(selector.slice(1));

  expect(html).toMatch(new RegExp(`<[^>]+class="[^"]*\\b${className}\\b[^"]*"[^>]*>`));
}

const visibleComponentAssertions = {
  accordion(html) {
    expect(html).toMatch(
      /<div\b(?=[^>]*id="support-types")(?=[^>]*data-module="govuk-accordion")[^>]*>/,
    );
    expect(html).toContain('Temporary accommodation');
  },
  'back-link'(html) {
    expect(html).toMatch(
      /<a\b(?=[^>]*href="\/demo\/support\/start")(?=[^>]*class="[^"]*\bgovuk-back-link\b[^"]*")[^>]*>\s*Back\s*<\/a>/,
    );
  },
  breadcrumbs(html) {
    expect(html).toMatch(
      /<nav\b(?=[^>]*class="[^"]*\bgovuk-breadcrumbs\b[^"]*")(?=[^>]*aria-label="Breadcrumb")[^>]*>/,
    );
    expect(html).toContain('Fictional support request queue');
    expect(html).toMatch(
      /<li\b[^>]*class="[^"]*\bgovuk-breadcrumbs__list-item\b[^"]*"[^>]*aria-current="page"[^>]*>\s*DEMO-CW-1001\s*<\/li>/,
    );
  },
  button(html) {
    expect(html).toMatch(
      /<a\b(?=[^>]*href="\/demo\/support\/eligibility")(?=[^>]*class="[^"]*\bgovuk-button--start\b[^"]*")(?=[^>]*data-module="govuk-button")[^>]*>\s*Start now/,
    );
  },
  'character-count'(html) {
    expect(html).toMatch(
      /<div\b(?=[^>]*class="[^"]*\bgovuk-character-count\b[^"]*")(?=[^>]*data-module="govuk-character-count")(?=[^>]*data-maxlength="500")[^>]*>/,
    );
    expect(html).toContain('You can enter up to 500 characters');
  },
  checkboxes(html) {
    expect(html).toMatch(
      /<div\b(?=[^>]*class="[^"]*\bgovuk-checkboxes\b[^"]*")(?=[^>]*data-module="govuk-checkboxes")[^>]*>/,
    );
    expect(html).toContain('What types of fictional support are needed?');
    expect(html).toMatch(
      /<input\b(?=[^>]*name="supportTypes")(?=[^>]*type="checkbox")(?=[^>]*value="safe-accommodation")[^>]*>/,
    );
  },
  'cookie-banner'(html) {
    expect(html).toMatch(
      /<div\b(?=[^>]*class="[^"]*\bgovuk-cookie-banner\b[^"]*")(?=[^>]*role="region")(?=[^>]*aria-label="Cookie banner")[^>]*>/,
    );
    expect(html).toContain('Cookies on this component demo');
    expect(html).toContain('Accept optional cookies');
    expect(html).toContain('Reject optional cookies');
  },
  'date-input'(html) {
    expect(html).toMatch(
      /<div\b(?=[^>]*class="[^"]*\bgovuk-date-input\b[^"]*")(?=[^>]*id="dateOfBirth")[^>]*>/,
    );
    expect(html).toContain('Date of birth');
    expect(html).toMatch(/<label\b[^>]*for="dateOfBirth-day"[^>]*>\s*Day\s*<\/label>/);
    expect(html).toMatch(/<label\b[^>]*for="dateOfBirth-month"[^>]*>\s*Month\s*<\/label>/);
    expect(html).toMatch(/<label\b[^>]*for="dateOfBirth-year"[^>]*>\s*Year\s*<\/label>/);
  },
  details(html) {
    expect(html).toMatch(/<details\b[^>]*class="[^"]*\bgovuk-details\b[^"]*"[^>]*>/);
    expect(html).toContain('How Exit this page works');
    expect(html).toContain('It does not remove this service from your browser history');
  },
  'error-message'(html) {
    expect(html).toMatch(
      /<p\b(?=[^>]*id="eligibility-error")(?=[^>]*class="[^"]*\bgovuk-error-message\b[^"]*")[^>]*>/,
    );
    expect(html).toContain('Select whether the fictional request is eligible to continue');
  },
  'error-summary'(html) {
    expect(html).toMatch(
      /<div\b(?=[^>]*class="[^"]*\bgovuk-error-summary\b[^"]*")(?=[^>]*data-module="govuk-error-summary")[^>]*>/,
    );
    expect(html).toContain('There is a problem');
    expect(html).toMatch(
      /<a\b[^>]*href="#eligibility"[^>]*>\s*Select whether the fictional request is eligible to continue\s*<\/a>/,
    );
  },
  'exit-this-page'(html) {
    expect(html).toMatch(
      /<div\b(?=[^>]*class="[^"]*\bgovuk-exit-this-page\b[^"]*")(?=[^>]*data-module="govuk-exit-this-page")[^>]*>/,
    );
    expect(html).toMatch(
      /<a\b(?=[^>]*href="https:\/\/www\.bbc\.co\.uk\/weather")(?=[^>]*class="[^"]*\bgovuk-exit-this-page__button\b[^"]*")(?=[^>]*rel="nofollow noreferrer")[^>]*>/,
    );
    expect(html).toContain('<span class="govuk-visually-hidden">Emergency</span> Exit this page');
  },
};

describe('demo component render coverage items 1-12', () => {
  test('keeps this evidence batch aligned with the first 12 register entries', () => {
    expect(item26Coverage.map(({ component }) => component)).toEqual(item26ComponentNames);
    expect(Object.keys(visibleComponentAssertions)).toEqual(item26ComponentNames);
  });

  test.each(item26Coverage)(
    '$component is visible at $route in the $state state',
    async (entry) => {
      const response = await renderDemoComponentState(entry);

      expectRegisteredClass(response.text, entry.selector);
      visibleComponentAssertions[entry.component](response.text);
    },
  );
});
