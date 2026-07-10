const { expect, test } = require('./fixtures');
const { VIEWPORTS } = require('./helpers/viewports');

for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${viewportName} demo shell`, () => {
    test.use({ viewport });

    test('renders the fictional landing page with and without JavaScript', async ({
      makeAxeBuilder,
      page,
    }, testInfo) => {
      const response = await page.goto('/demo');

      expect(response).not.toBeNull();
      expect(response.ok()).toBe(true);
      await expect(page).toHaveTitle(
        'Choose a fictional service journey - Fictional support service demo',
      );
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Choose a fictional service journey',
      );
      await expect(page.getByText('This service is fictional.', { exact: true })).toBeVisible();
      await expect(
        page.getByText('Do not enter real personal information or passwords.', {
          exact: true,
        }),
      ).toBeVisible();

      await expect(page.getByRole('link', { name: 'Explore the public journey' })).toHaveAttribute(
        'href',
        '/demo/support/start',
      );
      await expect(
        page.getByRole('link', { name: 'Explore the caseworker journey' }),
      ).toHaveAttribute('href', '/demo/casework/sign-in');

      await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeAttached();
      await expect(page.locator('header.govuk-header')).toBeVisible();
      await expect(page.locator('.govuk-service-navigation')).toBeVisible();
      await expect(page.locator('.govuk-phase-banner')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.locator('footer.govuk-footer')).toBeVisible();

      const body = page.locator('body');
      const javaScriptEnabled = testInfo.project.use.javaScriptEnabled !== false;

      if (javaScriptEnabled) {
        await expect(body).toHaveClass(/\bjs-enabled\b/);
        await expect(body).toHaveClass(/\bgovuk-frontend-supported\b/);
      } else {
        await expect(body).not.toHaveClass(/\bjs-enabled\b/);
        await expect(body).not.toHaveClass(/\bgovuk-frontend-supported\b/);
      }

      // Axe's asynchronous rule runner needs page timers, so scan once in a JavaScript context.
      if (viewportName === 'desktop' && javaScriptEnabled) {
        const { violations } = await makeAxeBuilder().analyze();

        expect(violations).toEqual([]);
      }

      const pageWidths = await page.locator('html').evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));

      expect(
        pageWidths.scrollWidth,
        `${viewportName} layout should not overflow horizontally`,
      ).toBeLessThanOrEqual(pageWidths.clientWidth);
    });
  });
}
