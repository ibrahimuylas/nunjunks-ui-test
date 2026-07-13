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

const item27ComponentNames = [
  'fieldset',
  'file-upload',
  'footer',
  'header',
  'hint',
  'input',
  'inset-text',
  'label',
  'notification-banner',
  'pagination',
  'panel',
  'password-input',
];

const item27Coverage = demoComponentCoverage.slice(
  item26ComponentNames.length,
  item26ComponentNames.length + item27ComponentNames.length,
);

const item28ComponentNames = [
  'phase-banner',
  'radios',
  'select',
  'service-navigation',
  'skip-link',
  'summary-list',
  'table',
  'tabs',
  'tag',
  'task-list',
  'textarea',
  'warning-text',
];

const item28Coverage = demoComponentCoverage.slice(
  item26ComponentNames.length + item27ComponentNames.length,
);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function registeredSelectorPattern(selector) {
  const selectorParts = selector.match(
    /^(?<tag>[a-z][a-z0-9-]*)?\.(?<className>[a-z0-9_-]+)(?:\[(?<attribute>[a-z][a-z0-9-]*)="(?<value>[^"]+)"\])?$/,
  );

  if (!selectorParts) {
    throw new Error(`Unsupported component coverage selector: ${selector}`);
  }

  const { tag, className, attribute, value } = selectorParts.groups;
  const tagPattern = tag ? escapeRegExp(tag) : '[a-z][a-z0-9-]*';
  const attributePattern = attribute
    ? `(?=[^>]*\\b${escapeRegExp(attribute)}="${escapeRegExp(value)}")`
    : '';

  return `<${tagPattern}\\b(?=[^>]*class="[^"]*\\b${escapeRegExp(className)}\\b[^"]*")${attributePattern}[^>]*>`;
}

function expectRegisteredSelector(html, selector) {
  const selectorPatterns = selector.split(/\s+/).map(registeredSelectorPattern);

  expect(html).toMatch(new RegExp(selectorPatterns.join('[\\s\\S]*?')));
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

const item27VisibleComponentAssertions = {
  fieldset(html) {
    expect(html).toMatch(
      /<fieldset\b(?=[^>]*class="[^"]*\bgovuk-fieldset\b[^"]*")(?=[^>]*aria-describedby="eligibility-hint")[^>]*>/,
    );
    expect(html).toMatch(
      /<legend\b[^>]*class="[^"]*\bgovuk-fieldset__legend\b[^"]*"[^>]*>[\s\S]*?<h1\b[^>]*class="[^"]*\bgovuk-fieldset__heading\b[^"]*"[^>]*>\s*Can this fictional support request continue\?\s*<\/h1>[\s\S]*?<\/legend>/,
    );
  },
  'file-upload'(html) {
    expect(html).toMatch(
      /<div\b(?=[^>]*class="[^"]*\bgovuk-drop-zone\b[^"]*")(?=[^>]*data-module="govuk-file-upload")[^>]*>/,
    );
    expect(html).toMatch(
      /<input\b(?=[^>]*class="[^"]*\bgovuk-file-upload\b[^"]*")(?=[^>]*id="evidence")(?=[^>]*name="evidence")(?=[^>]*type="file")(?=[^>]*aria-describedby="evidence-hint")[^>]*>/,
    );
    expect(html).toContain('Upload a fictional supporting document (optional)');
    expect(html).toContain('Maximum file size: 2 MB');
  },
  footer(html) {
    expect(html).toMatch(/<footer\b[^>]*class="[^"]*\bgovuk-footer\b[^"]*"[^>]*>/);
    expect(html).toContain('Open Government Licence');
  },
  header(html) {
    expect(html).toMatch(
      /<header\b(?=[^>]*class="[^"]*\bgovuk-header\b[^"]*")(?=[^>]*data-module="govuk-header")[^>]*>/,
    );
    expect(html).toMatch(
      /<a\b(?=[^>]*href="\/demo")(?=[^>]*class="[^"]*\bgovuk-header__link--homepage\b[^"]*")[^>]*>/,
    );
    expect(html).toContain('Component demo');
  },
  hint(html) {
    expect(html).toMatch(
      /<fieldset\b(?=[^>]*class="[^"]*\bgovuk-fieldset\b[^"]*")(?=[^>]*aria-describedby="eligibility-hint")[^>]*>[\s\S]*?<div\b(?=[^>]*id="eligibility-hint")(?=[^>]*class="[^"]*\bgovuk-hint\b[^"]*")[^>]*>\s*This answer only controls the demonstration\. It is not an eligibility decision for a real service\.\s*<\/div>[\s\S]*?<div\b[^>]*class="[^"]*\bgovuk-radios\b[^"]*"/,
    );
  },
  input(html) {
    expect(html).toMatch(
      /<input\b(?=[^>]*class="[^"]*\bgovuk-input\b[^"]*")(?=[^>]*id="fullName")(?=[^>]*name="fullName")(?=[^>]*type="text")(?=[^>]*aria-describedby="fullName-hint")(?=[^>]*autocomplete="off")[^>]*>/,
    );
    expect(html).toContain('For example, Alex Example. Do not enter a real name.');
  },
  'inset-text'(html) {
    expect(html).toMatch(
      /<div\b[^>]*class="[^"]*\bgovuk-inset-text\b[^"]*"[^>]*>\s*This demo keeps made-up answers in your current session only\. It does not send them to a housing service or any external system\.\s*<\/div>/,
    );
  },
  label(html) {
    expect(html).toMatch(
      /<label\b(?=[^>]*class="[^"]*\bgovuk-label\b[^"]*")(?=[^>]*for="fullName")[^>]*>\s*Fictional full name\s*<\/label>[\s\S]*?<input\b[^>]*id="fullName"[^>]*>/,
    );
  },
  'notification-banner'(html) {
    expect(html).toMatch(
      /<div\b(?=[^>]*class="[^"]*\bgovuk-notification-banner\b[^"]*")(?=[^>]*role="region")(?=[^>]*aria-labelledby="govuk-notification-banner-title")(?=[^>]*data-module="govuk-notification-banner")[^>]*>/,
    );
    expect(html).toMatch(
      /<h2\b(?=[^>]*class="[^"]*\bgovuk-notification-banner__title\b[^"]*")(?=[^>]*id="govuk-notification-banner-title")[^>]*>\s*New fictional work\s*<\/h2>/,
    );
    expect(html).toMatch(
      /\d+ newly assigned fictional requests? (?:is|are) available in My requests\./,
    );
  },
  pagination(html) {
    expect(html).toMatch(
      /<nav\b(?=[^>]*class="[^"]*\bgovuk-pagination\b[^"]*")(?=[^>]*aria-label="Unassigned fictional requests pagination")[^>]*>/,
    );
    expect(html).toMatch(
      /<a\b(?=[^>]*href="\/demo\/casework\/queue\?tab=unassigned&amp;page=1")(?=[^>]*class="[^"]*\bgovuk-pagination__link\b[^"]*")(?=[^>]*rel="prev")[^>]*>/,
    );
    expect(html).toMatch(
      /<a\b(?=[^>]*class="[^"]*\bgovuk-pagination__link\b[^"]*")(?=[^>]*aria-label="Page 2")(?=[^>]*aria-current="page")[^>]*>\s*2\s*<\/a>/,
    );
  },
  panel(html) {
    expect(html).toMatch(
      /<div\b[^>]*class="[^"]*\bgovuk-panel\b[^"]*\bgovuk-panel--confirmation\b[^"]*"[^>]*>/,
    );
    expect(html).toMatch(
      /<h1\b[^>]*class="[^"]*\bgovuk-panel__title\b[^"]*"[^>]*>\s*Fictional request submitted\s*<\/h1>/,
    );
    expect(html).toMatch(/Your fictional reference is DEMO-[A-F0-9]{8}/);
  },
  'password-input'(html) {
    expect(html).toMatch(
      /<div\b(?=[^>]*class="[^"]*\bgovuk-password-input\b[^"]*")(?=[^>]*data-module="govuk-password-input")[^>]*>/,
    );
    expect(html).toMatch(
      /<input\b(?=[^>]*class="[^"]*\bgovuk-password-input__input\b[^"]*")(?=[^>]*id="password")(?=[^>]*name="password")(?=[^>]*type="password")(?=[^>]*aria-describedby="password-hint")[^>]*>/,
    );
    expect(html).toMatch(
      /<button\b(?=[^>]*type="button")(?=[^>]*class="[^"]*\bgovuk-password-input__toggle\b[^"]*")[^>]*>\s*Show\s*<\/button>/,
    );
    expect(html).toContain('Enter any made-up value. Do not use a real password.');
  },
};

const item28VisibleComponentAssertions = {
  'phase-banner'(html) {
    expect(html).toMatch(
      /<div\b[^>]*class="[^"]*\bgovuk-phase-banner\b[^"]*"[^>]*>[\s\S]*?<strong\b(?=[^>]*class="[^"]*\bgovuk-tag\b[^"]*")(?=[^>]*class="[^"]*\bgovuk-phase-banner__content__tag\b[^"]*")[^>]*>\s*Prototype\s*<\/strong>/,
    );
    expect(html).toMatch(
      /<span\b[^>]*class="[^"]*\bgovuk-phase-banner__text\b[^"]*"[^>]*>\s*This is a fictional service for demonstrating GOV\.UK components\.\s*<\/span>/,
    );
  },
  radios(html) {
    expect(html).toMatch(
      /<div\b(?=[^>]*class="[^"]*\bgovuk-radios\b[^"]*")(?=[^>]*data-module="govuk-radios")[^>]*>/,
    );
    expect(html).toMatch(
      /<input\b(?=[^>]*class="[^"]*\bgovuk-radios__input\b[^"]*")(?=[^>]*id="eligibility")(?=[^>]*name="eligibility")(?=[^>]*type="radio")(?=[^>]*value="eligible")[^>]*>[\s\S]*?<label\b[^>]*for="eligibility"[^>]*>\s*Yes, continue to the fictional application tasks\s*<\/label>/,
    );
    expect(html).toMatch(
      /<input\b(?=[^>]*id="eligibility-2")(?=[^>]*name="eligibility")(?=[^>]*type="radio")(?=[^>]*value="ineligible")[^>]*>[\s\S]*?<label\b[^>]*for="eligibility-2"[^>]*>\s*No, show the fictional ineligible outcome\s*<\/label>/,
    );
  },
  select(html) {
    expect(html).toMatch(
      /<select\b(?=[^>]*class="[^"]*\bgovuk-select\b[^"]*")(?=[^>]*id="country")(?=[^>]*name="country")(?=[^>]*aria-describedby="country-hint")[^>]*>[\s\S]*?<option\b[^>]*value="scotland"[^>]*>Scotland<\/option>[\s\S]*?<\/select>/,
    );
    expect(html).toMatch(/<label\b[^>]*for="country"[^>]*>\s*Current country\s*<\/label>/);
    expect(html).toContain('Choose a fictional current country.');
  },
  'service-navigation'(html) {
    expect(html).toMatch(
      /<section\b(?=[^>]*class="[^"]*\bgovuk-service-navigation\b[^"]*")(?=[^>]*data-module="govuk-service-navigation")[^>]*>/,
    );
    expect(html).toMatch(
      /<a\b(?=[^>]*class="[^"]*\bgovuk-service-navigation__link\b[^"]*")(?=[^>]*href="\/demo")(?=[^>]*aria-current="page")[^>]*>/,
    );
    expect(html).toContain('Fictional support service');
    expect(html).toContain('href="/demo/support/start"');
    expect(html).toContain('href="/demo/casework/sign-in"');
  },
  'skip-link'(html) {
    expect(html).toMatch(
      /<a\b(?=[^>]*href="#main-content")(?=[^>]*class="[^"]*\bgovuk-skip-link\b[^"]*")(?=[^>]*data-module="govuk-skip-link")[^>]*>\s*Skip to main content\s*<\/a>/,
    );
    expect(html).toMatch(/<main\b(?=[^>]*id="main-content")(?=[^>]*role="main")[^>]*>/);
  },
  'summary-list'(html) {
    expect(html.match(/<dl\b[^>]*class="[^"]*\bgovuk-summary-list\b[^"]*"[^>]*>/g)).toHaveLength(4);
    expect(html).toMatch(
      /<div\b[^>]*class="[^"]*\bgovuk-summary-card\b[^"]*"[^>]*>[\s\S]*?<h2\b[^>]*class="[^"]*\bgovuk-summary-card__title\b[^"]*"[^>]*>\s*About you\s*<\/h2>[\s\S]*?<dt\b[^>]*class="[^"]*\bgovuk-summary-list__key\b[^"]*"[^>]*>\s*Fictional full name\s*<\/dt>[\s\S]*?<dd\b[^>]*class="[^"]*\bgovuk-summary-list__value\b[^"]*"[^>]*>\s*Alex Example\s*<\/dd>/,
    );
    expect(html).toMatch(
      /<dd\b[^>]*class="[^"]*\bgovuk-summary-list__actions\b[^"]*"[^>]*>[\s\S]*?<a\b[^>]*href="\/demo\/support\/about-you\/change"[^>]*>\s*Change/,
    );
  },
  table(html) {
    const firstQueueTable = html.match(
      /<table\b[^>]*class="[^"]*\bgovuk-table\b[^"]*"[^>]*>[\s\S]*?<\/table>/,
    )?.[0];

    expect(firstQueueTable).toBeDefined();
    expect(firstQueueTable).toMatch(
      /<caption\b[^>]*class="[^"]*\bgovuk-table__caption\b[^"]*"[^>]*>Unassigned fictional requests<\/caption>/,
    );
    expect(firstQueueTable).toMatch(
      /<th\b(?=[^>]*scope="col")(?=[^>]*class="[^"]*\bgovuk-table__header\b[^"]*")[^>]*>Reference<\/th>/,
    );
    expect(firstQueueTable).toMatch(
      /<th\b(?=[^>]*scope="row")(?=[^>]*class="[^"]*\bgovuk-table__header\b[^"]*")[^>]*><a\b[^>]*href="\/demo\/casework\/requests\/DEMO-CW-1001\?tab=unassigned&amp;page=1"[^>]*>DEMO-CW-1001<\/a><\/th>/,
    );
    expect(firstQueueTable).toContain('<td class="govuk-table__cell">Demo household Aster</td>');
  },
  tabs(html) {
    expect(html).toMatch(
      /<div\b(?=[^>]*class="[^"]*\bgovuk-tabs\b[^"]*")(?=[^>]*data-module="govuk-tabs")[^>]*>/,
    );
    expect(html).toMatch(
      /<h2\b[^>]*class="[^"]*\bgovuk-tabs__title\b[^"]*"[^>]*>\s*Fictional request queues\s*<\/h2>/,
    );
    expect(html.match(/class="govuk-tabs__tab"/g)).toHaveLength(3);
    expect(html).toMatch(
      /<li\b[^>]*class="[^"]*\bgovuk-tabs__list-item--selected\b[^"]*"[^>]*>\s*<a\b[^>]*href="#casework-queue-unassigned"[^>]*>\s*Unassigned\s*<\/a>/,
    );
    expect(html).toMatch(
      /<div\b[^>]*class="[^"]*\bgovuk-tabs__panel\b[^"]*"[^>]*id="casework-queue-unassigned"[^>]*>/,
    );
  },
  tag(html) {
    expect(html).toMatch(
      /<div\b[^>]*class="[^"]*\bgovuk-task-list__status\b[^"]*"[^>]*>[\s\S]*?<strong\b[^>]*class="[^"]*\bgovuk-tag--green\b[^"]*"[^>]*>\s*Completed\s*<\/strong>/,
    );
    expect(html).toMatch(
      /<div\b[^>]*class="[^"]*\bgovuk-task-list__status\b[^"]*"[^>]*>[\s\S]*?<strong\b[^>]*class="[^"]*\bgovuk-tag--light-blue\b[^"]*"[^>]*>\s*In progress\s*<\/strong>/,
    );
    expect(html).toMatch(
      /<div\b[^>]*class="[^"]*\bgovuk-task-list__status\b[^"]*"[^>]*>[\s\S]*?<strong\b[^>]*class="[^"]*\bgovuk-tag--blue\b[^"]*"[^>]*>\s*Not started\s*<\/strong>/,
    );
    expect(html).toMatch(
      /<div\b[^>]*class="[^"]*\bgovuk-task-list__status\b[^"]*"[^>]*>[\s\S]*?<strong\b[^>]*class="[^"]*\bgovuk-tag--grey\b[^"]*"[^>]*>\s*Cannot start yet\s*<\/strong>/,
    );
  },
  'task-list'(html) {
    expect(html).toMatch(/<ul\b[^>]*class="[^"]*\bgovuk-task-list\b[^"]*"[^>]*>/);
    expect(html.match(/<li\b[^>]*class="[^"]*\bgovuk-task-list__item\b[^"]*"[^>]*>/g)).toHaveLength(
      4,
    );
    expect(html).toMatch(
      /<a\b(?=[^>]*href="\/demo\/support\/about-you")(?=[^>]*class="[^"]*\bgovuk-task-list__link\b[^"]*")(?=[^>]*aria-describedby="support-task-1-hint support-task-1-status")[^>]*>\s*About you\s*<\/a>/,
    );
    expect(html).toMatch(
      /<div\b[^>]*class="[^"]*\bgovuk-task-list__name-and-hint\b[^"]*"[^>]*>\s*<div\b[^>]*>\s*Check your answers\s*<\/div>\s*<\/div>[\s\S]*?<div\b[^>]*id="support-task-4-status"[^>]*>/,
    );
    expect(html).not.toMatch(
      /<a\b(?=[^>]*href="\/demo\/support\/check-answers")(?=[^>]*class="[^"]*\bgovuk-task-list__link\b)/,
    );
  },
  textarea(html) {
    expect(html).toMatch(
      /<textarea\b(?=[^>]*class="[^"]*\bgovuk-textarea\b[^"]*")(?=[^>]*id="additionalInformation")(?=[^>]*name="additionalInformation")(?=[^>]*rows="5")(?=[^>]*aria-describedby="additionalInformation-hint")[^>]*><\/textarea>/,
    );
    expect(html).toMatch(
      /<label\b[^>]*for="additionalInformation"[^>]*>\s*Additional information \(optional\)\s*<\/label>/,
    );
    expect(html).toContain(
      'Add any other fictional information that would help explain the request.',
    );
  },
  'warning-text'(html) {
    expect(html).toMatch(
      /<div\b[^>]*class="[^"]*\bgovuk-warning-text\b[^"]*"[^>]*>[\s\S]*?<span\b(?=[^>]*class="[^"]*\bgovuk-warning-text__icon\b[^"]*")(?=[^>]*aria-hidden="true")[^>]*>!<\/span>[\s\S]*?<strong\b[^>]*class="[^"]*\bgovuk-warning-text__text\b[^"]*"[^>]*>[\s\S]*?<span\b[^>]*class="[^"]*\bgovuk-visually-hidden\b[^"]*"[^>]*>Warning<\/span>\s*If continuing could put you at risk, use Exit this page now and consider using a device you trust\.\s*<\/strong>/,
    );
  },
};

const allVisibleComponentAssertions = {
  ...visibleComponentAssertions,
  ...item27VisibleComponentAssertions,
  ...item28VisibleComponentAssertions,
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

      expectRegisteredSelector(response.text, entry.selector);
      visibleComponentAssertions[entry.component](response.text);
    },
  );
});

describe('demo component render coverage items 13-24', () => {
  test('keeps this evidence batch aligned with register entries 13-24', () => {
    expect(item27Coverage.map(({ component }) => component)).toEqual(item27ComponentNames);
    expect(Object.keys(item27VisibleComponentAssertions)).toEqual(item27ComponentNames);
  });

  test.each(item27Coverage)(
    '$component is visible at $route in the $state state',
    async (entry) => {
      const response = await renderDemoComponentState(entry);

      expectRegisteredSelector(response.text, entry.selector);
      item27VisibleComponentAssertions[entry.component](response.text);
    },
  );
});

describe('demo component render coverage items 25-36', () => {
  test('keeps this evidence batch aligned with register entries 25-36', () => {
    expect(item28Coverage.map(({ component }) => component)).toEqual(item28ComponentNames);
    expect(Object.keys(item28VisibleComponentAssertions)).toEqual(item28ComponentNames);
  });

  test.each(item28Coverage)(
    '$component is visible at $route in the $state state',
    async (entry) => {
      const response = await renderDemoComponentState(entry);

      expectRegisteredSelector(response.text, entry.selector);
      item28VisibleComponentAssertions[entry.component](response.text);
    },
  );
});

test('reports component-specific visible evidence for every coverage-register entry', () => {
  expect(Object.keys(allVisibleComponentAssertions)).toEqual(
    demoComponentCoverage.map(({ component }) => component),
  );
});
