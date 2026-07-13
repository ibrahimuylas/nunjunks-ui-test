const { Buffer } = require('buffer');
const { expect, test } = require('./fixtures');
const { chooseEligibility, supportPaths } = require('./helpers/demo-support');

const eligibleLabel = 'Yes, continue to the fictional application tasks';
const validationConsoleMessage =
  'console.error: Failed to load resource: the server responded with a status of 400 (Bad Request) (http://[::1]:3000/demo/support/eligibility:1:1)';

async function openEligibleTaskList(page) {
  await page.goto(supportPaths.eligibility);
  await page.getByLabel(eligibleLabel, { exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(supportPaths.tasks);
}

test.describe('public support progressive enhancements', () => {
  test.use({ allowedConsoleMessages: [validationConsoleMessage] });

  test('operates the accordion from the keyboard', async ({ page }) => {
    await page.goto(supportPaths.start);

    const accordion = page.locator('#support-types');
    const sectionButton = accordion.locator('.govuk-accordion__section-button').first();
    const sectionContent = page.locator('#support-types-content-1');

    await expect(accordion).toHaveAttribute('data-govuk-accordion-init', '');
    await expect(sectionButton).toHaveAttribute('aria-expanded', 'false');
    await expect(sectionContent).toBeHidden();

    await sectionButton.focus();
    await expect(sectionButton).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(sectionButton).toHaveAttribute('aria-expanded', 'true');
    await expect(sectionContent).toBeVisible();
    await expect(sectionContent).toContainText(
      'The demo shows how someone could describe needing somewhere safe to stay.',
    );

    await page.keyboard.press('Space');
    await expect(sectionButton).toHaveAttribute('aria-expanded', 'false');
    await expect(sectionContent).toBeHidden();
  });

  test('updates the character count and preserves server-side validation focus', async ({
    page,
  }) => {
    await page.goto(supportPaths.eligibility);
    await page.getByRole('button', { name: 'Continue' }).click();

    const errorSummary = page.locator('.govuk-error-summary');
    const errorLink = errorSummary.getByRole('link', {
      name: 'Select whether the fictional request is eligible to continue',
    });

    await expect(errorSummary).toHaveAttribute('data-govuk-error-summary-init', '');
    await expect(errorSummary).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(errorLink).toBeFocused();
    await expect(errorLink).toHaveCSS('background-color', 'rgb(255, 221, 0)');
    await page.keyboard.press('Enter');
    await expect(page.getByLabel(eligibleLabel, { exact: true })).toBeFocused();

    await chooseEligibility(page, eligibleLabel);
    await page.getByRole('link', { name: 'Support needs' }).click();

    const characterCount = page.locator('[data-module="govuk-character-count"]');
    const description = page.getByLabel('Describe the fictional support needed');
    const visibleCount = characterCount.locator('.govuk-character-count__status');

    await expect(characterCount).toHaveAttribute('data-govuk-character-count-init', '');
    await expect(description).not.toHaveAttribute('maxlength');
    await expect(visibleCount).toHaveText('You have 500 characters remaining');

    await description.fill('Fictional need');
    await expect(visibleCount).toHaveText('You have 486 characters remaining');

    await description.fill('x'.repeat(501));
    await expect(visibleCount).toHaveText('You have 1 character too many');
    await expect(visibleCount).toHaveClass(/\bgovuk-error-message\b/);
    await expect(description).toHaveClass(/\bgovuk-textarea--error\b/);
  });

  test('selects and submits a file through the enhanced upload control', async ({ page }) => {
    await openEligibleTaskList(page);
    await page.getByRole('link', { name: 'Evidence' }).click();

    const dropZone = page.locator('[data-module="govuk-file-upload"]');
    const uploadButton = dropZone.locator('.govuk-file-upload-button');
    const fileInput = page.locator('#evidence-input');

    await expect(dropZone).toHaveAttribute('data-govuk-file-upload-init', '');
    await expect(fileInput).toHaveAttribute('hidden', 'true');
    await expect(fileInput).toHaveAttribute('aria-hidden', 'true');
    await expect(uploadButton).toContainText('No file chosen');

    await fileInput.setInputFiles({
      name: 'fictional-evidence.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fictional browser-test evidence'),
    });

    await expect(uploadButton).toContainText('fictional-evidence.pdf');
    await expect(uploadButton).not.toHaveClass(/\bgovuk-file-upload-button--empty\b/);

    await page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(page).toHaveURL(supportPaths.tasks);

    await page.getByRole('link', { name: 'Evidence' }).click();
    await expect(page.getByText('Selected demonstration file:')).toContainText(
      'fictional-evidence.pdf',
    );
  });
});
