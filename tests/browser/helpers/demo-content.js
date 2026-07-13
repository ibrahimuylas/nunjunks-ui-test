const { expect } = require('../fixtures');

const headingSelector =
  '#main-content h1, #main-content h2, #main-content h3, #main-content h4, #main-content h5, #main-content h6';

async function expectLogicalMainHeadingOrder(page) {
  const headings = await page.locator(headingSelector).evaluateAll((elements) =>
    elements.map((element) => ({
      level: Number(element.tagName.slice(1)),
      isErrorSummary: element.classList.contains('govuk-error-summary__title'),
    })),
  );

  expect(headings.length, 'main content should have at least one heading').toBeGreaterThan(0);

  const pageHeadingIndex = headings.findIndex(({ level }) => level === 1);

  expect(pageHeadingIndex, 'main content should have a page heading').toBeGreaterThanOrEqual(0);
  expect(
    headings.filter(({ level }) => level === 1),
    'main content should have one h1',
  ).toHaveLength(1);

  headings.slice(0, pageHeadingIndex).forEach(({ level, isErrorSummary }) => {
    expect(isErrorSummary, 'only the standard error-summary title may precede the h1').toBe(true);
    expect(level, 'the standard error-summary title should be an h2').toBe(2);
  });

  let previousLevel = 1;

  headings.slice(pageHeadingIndex + 1).forEach(({ level }) => {
    expect(
      level,
      `heading level h${level} should not skip after h${previousLevel}`,
    ).toBeLessThanOrEqual(previousLevel + 1);
    previousLevel = level;
  });
}

async function expectDescriptiveLinks(page) {
  const links = await page.locator('a[href]').evaluateAll((elements) =>
    elements.map((element) => ({
      href: element.getAttribute('href'),
      name: (element.getAttribute('aria-label') || element.textContent || '')
        .replace(/\s+/g, ' ')
        .trim(),
    })),
  );
  const ambiguousNames = new Set(['click here', 'here', 'learn more', 'more', 'read more']);

  links.forEach(({ href, name }) => {
    expect(name, `link to ${href} should have an accessible name`).not.toBe('');
    expect(
      ambiguousNames.has(name.toLowerCase()),
      `link name "${name}" should describe its destination or action`,
    ).toBe(false);
  });
}

async function expectReviewedDemoPage(page, { heading, mainText }) {
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
  await expect(page.locator('.govuk-header__product-name')).toHaveText('Fictional component demo');
  await expect(page.locator('.govuk-service-navigation__service-name')).toHaveText(
    'Fictional support service',
  );
  await expect(page.locator('.govuk-phase-banner')).toContainText(
    'This is a fictional service for demonstrating GOV.UK components.',
  );
  await expect(page.locator('#main-content')).toContainText(mainText);
  await expect(page.locator('#main-content')).toContainText(/fictional|demonstration|made-up/i);
  await expectLogicalMainHeadingOrder(page);
  await expectDescriptiveLinks(page);
}

module.exports = { expectLogicalMainHeadingOrder, expectReviewedDemoPage };
