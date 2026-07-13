const { expect, test } = require('./fixtures');
const { supportPaths } = require('./helpers/demo-support');

async function expectGovukKeyboardFocus(locator) {
  await expect(locator).toBeFocused();
  await expect(locator).toHaveCSS('background-color', 'rgb(255, 221, 0)');
  await expect(locator).toHaveCSS('color', 'rgb(11, 12, 12)');
}

test.describe('shared demo component interactions', () => {
  for (const choice of [
    { action: 'Accept', acknowledgement: 'accepted', tabs: 1 },
    { action: 'Reject', acknowledgement: 'rejected', tabs: 2 },
  ]) {
    test(`handles the ${choice.action.toLowerCase()} cookie choice from the keyboard`, async ({
      page,
    }) => {
      await page.goto(supportPaths.start);

      const cookieBanner = page.getByRole('region', { name: 'Cookie banner' });
      const choiceButton = page.getByRole('button', {
        name: `${choice.action} optional cookies`,
      });

      await expect(cookieBanner).toBeVisible();
      for (let index = 0; index < choice.tabs; index += 1) {
        await page.keyboard.press('Tab');
      }
      await expectGovukKeyboardFocus(choiceButton);
      await page.keyboard.press('Enter');

      await expect(page).toHaveURL(supportPaths.start);
      await expect(page.getByRole('alert')).toContainText(
        `You ${choice.acknowledgement} optional cookies for this demonstration. No optional cookies were set.`,
      );

      const hideButton = page.getByRole('button', { name: 'Hide cookie message' });

      await page.keyboard.press('Tab');
      await expectGovukKeyboardFocus(hideButton);
      await page.keyboard.press('Enter');
      await expect(cookieBanner).toHaveCount(0);
    });
  }

  test('provides keyboard exit behavior', async ({ page }) => {
    await page.goto(supportPaths.start);
    await page.getByRole('button', { name: 'Reject optional cookies' }).click();
    await page.getByRole('button', { name: 'Hide cookie message' }).click();

    const mainSkipLink = page.getByRole('link', { name: 'Skip to main content' });
    const exitSkipLink = page.locator('.govuk-js-exit-this-page-skiplink');

    await expect(mainSkipLink).toHaveAttribute('data-govuk-skip-link-init', '');
    await page.keyboard.press('Tab');
    await expectGovukKeyboardFocus(mainSkipLink);
    await page.keyboard.press('Tab');
    await expectGovukKeyboardFocus(exitSkipLink);

    await page.route('https://www.bbc.co.uk/weather**', async (route) => {
      await route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>Safe destination</title><h1>Safe destination</h1>',
      });
    });

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('https://www.bbc.co.uk/weather');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Safe destination');

    await page.goto(supportPaths.start);

    const exitThisPage = page.locator('[data-module="govuk-exit-this-page"]');
    const shortcutStatus = exitThisPage.getByRole('status');

    await expect(exitThisPage).toHaveAttribute('data-govuk-exit-this-page-init', '');
    await expect(exitThisPage.locator('.govuk-exit-this-page__indicator-light')).toHaveCount(3);

    await page.keyboard.press('Shift');
    await expect(shortcutStatus).toHaveText('Shift, press 2 more times to exit.');
    await expect(exitThisPage.locator('.govuk-exit-this-page__indicator-light--on')).toHaveCount(1);

    await page.keyboard.press('Shift');
    await expect(shortcutStatus).toHaveText('Shift, press 1 more time to exit.');
    await expect(exitThisPage.locator('.govuk-exit-this-page__indicator-light--on')).toHaveCount(2);

    await page.keyboard.press('Shift');
    await expect(page).toHaveURL('https://www.bbc.co.uk/weather');
  });
});
