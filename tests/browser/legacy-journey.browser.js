const { expect, test } = require('./fixtures');

test('legacy start route works with and without the GOV.UK JavaScript bootstrap', async ({
  page,
}, testInfo) => {
  const response = await page.goto('/start');

  expect(response).not.toBeNull();
  expect(response.ok()).toBe(true);
  await expect(page).toHaveTitle('Apply for a farming update - GOV.UK Defra example');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Apply for a farming update',
  );
  await expect(page.getByRole('button', { name: 'Start now' })).toHaveAttribute(
    'href',
    '/business-type',
  );

  const body = page.locator('body');
  const header = page.locator('[data-module="govuk-header"]');
  const startButton = page.locator('[data-module="govuk-button"]');
  const javaScriptEnabled = testInfo.project.use.javaScriptEnabled !== false;

  if (javaScriptEnabled) {
    await expect(body).toHaveClass(/\bjs-enabled\b/);
    await expect(body).toHaveClass(/\bgovuk-frontend-supported\b/);
    await expect(header).toHaveAttribute('data-govuk-header-init', '');
    await expect(startButton).toHaveAttribute('data-govuk-button-init', '');
  } else {
    await expect(body).not.toHaveClass(/\bjs-enabled\b/);
    await expect(body).not.toHaveClass(/\bgovuk-frontend-supported\b/);
    await expect(header).not.toHaveAttribute('data-govuk-header-init', '');
    await expect(startButton).not.toHaveAttribute('data-govuk-button-init', '');
  }
});
