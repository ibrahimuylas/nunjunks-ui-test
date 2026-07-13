const { expect, test } = require('./fixtures');
const {
  chooseEligibility,
  expectJavaScriptDisabled,
  expectTaskStatus,
  fillAboutYou,
  fillSupportNeeds,
  startSupportJourney,
  supportPaths,
  validAboutYou,
  validSupportNeeds,
} = require('./helpers/demo-support');
const { VIEWPORTS } = require('./helpers/viewports');

const eligibleLabel = 'Yes, continue to the fictional application tasks';
const ineligibleLabel = 'No, show the fictional ineligible outcome';
const expectedValidationConsoleMessages = [
  supportPaths.eligibility,
  supportPaths.aboutYou,
  supportPaths.supportNeeds,
].map(
  (path) =>
    `console.error: Failed to load resource: the server responded with a status of 400 (Bad Request) (http://[::1]:3000${path}:1:1)`,
);

test.describe('public support journey without JavaScript', () => {
  test.use({
    allowedConsoleMessages: expectedValidationConsoleMessages,
    javaScriptEnabled: false,
  });

  test.describe('at a desktop viewport', () => {
    test.use({ viewport: VIEWPORTS.desktop });

    test('recovers from validation errors and completes the eligible journey', async ({ page }) => {
      // This check completes every public form plus validation recovery, so it
      // needs more than the shared smoke-test budget on constrained runners.
      test.setTimeout(60_000);

      await startSupportJourney(page);

      await page.getByRole('button', { name: 'Continue' }).click();
      await expect(page.getByRole('alert')).toContainText('There is a problem');
      await expect(page.getByRole('alert')).toContainText(
        'Select whether the fictional request is eligible to continue',
      );
      await expectJavaScriptDisabled(page);

      await chooseEligibility(page, eligibleLabel);
      await expect(page).toHaveURL(supportPaths.tasks);
      await expectTaskStatus(page, 'About you', 'Not started');
      await expectTaskStatus(page, 'Support needs', 'Not started');
      await expectTaskStatus(page, 'Evidence', 'Not started');
      await expectTaskStatus(page, 'Check your answers', 'Cannot start yet');

      await page.getByRole('link', { name: 'About you' }).click();
      await fillAboutYou(page, { day: '31', month: '2' });
      await page.getByRole('button', { name: 'Save and continue' }).click();

      await expect(page.getByRole('alert')).toContainText('Enter a real date of birth');
      await expect(page.getByLabel('Fictional full name')).toHaveValue(validAboutYou.fullName);
      await expect(page.getByLabel('Current country')).toHaveValue(validAboutYou.country);
      await expect(page.locator('#dateOfBirth-day')).toHaveValue('31');
      await expect(page.locator('#dateOfBirth-month')).toHaveValue('2');

      await page.locator('#dateOfBirth-day').fill(validAboutYou.day);
      await page.locator('#dateOfBirth-month').fill(validAboutYou.month);
      await page.getByRole('button', { name: 'Save and continue' }).click();
      await expect(page).toHaveURL(supportPaths.tasks);
      await expectTaskStatus(page, 'About you', 'Completed');

      await page.getByRole('link', { name: 'Support needs' }).click();
      const longDescription = 'x'.repeat(501);
      await fillSupportNeeds(page, { description: longDescription });
      await page.getByRole('button', { name: 'Save and continue' }).click();

      await expect(page.getByRole('alert')).toContainText(
        'Description must be 500 characters or fewer',
      );
      await expect(page.getByLabel('Somewhere safe to stay', { exact: true })).toBeChecked();
      await expect(page.getByLabel('Health and wellbeing support', { exact: true })).toBeChecked();
      await expect(page.getByLabel('Describe the fictional support needed')).toHaveValue(
        longDescription,
      );
      await expect(page.getByLabel('Additional information (optional)')).toHaveValue(
        validSupportNeeds.additionalInformation,
      );

      await page
        .getByLabel('Describe the fictional support needed')
        .fill(validSupportNeeds.description);
      await page.getByRole('button', { name: 'Save and continue' }).click();
      await expect(page).toHaveURL(supportPaths.tasks);
      await expectTaskStatus(page, 'Support needs', 'Completed');

      await page.getByRole('link', { name: 'Evidence' }).click();
      await expect(
        page.getByLabel('Upload a fictional supporting document (optional)'),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Save and continue' }).click();
      await expect(page).toHaveURL(supportPaths.tasks);
      await expectTaskStatus(page, 'Evidence', 'Completed');
      await expectTaskStatus(page, 'Check your answers', 'Not started');

      await page.getByRole('link', { name: 'Check your answers' }).click();
      await expect(page).toHaveURL(supportPaths.checkAnswers);
      await expect(page.getByText(validAboutYou.fullName, { exact: true })).toBeVisible();
      await expect(page.getByText('7 September 1990', { exact: true })).toBeVisible();
      await expect(page.getByText('Scotland', { exact: true })).toBeVisible();
      await expect(page.getByText(validSupportNeeds.description, { exact: true })).toBeVisible();
      await expect(
        page.getByText(validSupportNeeds.additionalInformation, { exact: true }),
      ).toBeVisible();
      await expect(page.getByText('No file selected', { exact: true })).toBeVisible();

      await page.getByRole('link', { name: 'Change fictional full name' }).click();
      await expect(page.getByLabel('Fictional full name')).toHaveValue(validAboutYou.fullName);
      await expect(page.getByLabel('Current country')).toHaveValue(validAboutYou.country);
      await page.getByLabel('Fictional full name').fill('Jordan Example');
      await page.getByRole('button', { name: 'Save and continue' }).click();

      await expect(page).toHaveURL(supportPaths.checkAnswers);
      await expect(page.getByText('Jordan Example', { exact: true })).toBeVisible();
      await expect(page.getByText(validSupportNeeds.description, { exact: true })).toBeVisible();
      await expect(page.getByText('No file selected', { exact: true })).toBeVisible();

      await page.getByRole('button', { name: 'Submit fictional request' }).click();
      await expect(page).toHaveURL(supportPaths.confirmation);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Fictional request submitted',
      );
      await expect(page.locator('.govuk-panel')).toContainText(/DEMO-[A-F0-9]{8}/);
      await expectJavaScriptDisabled(page);
    });
  });

  test.describe('at a mobile viewport', () => {
    test.use({ viewport: VIEWPORTS.mobile });

    test('follows the ineligible branch and retains its answer for changes', async ({ page }) => {
      await startSupportJourney(page);
      await chooseEligibility(page, ineligibleLabel);

      await expect(page).toHaveURL(supportPaths.ineligible);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'This fictional request cannot continue',
      );
      await expect(
        page.getByText('This is an ineligible outcome for the component demonstration only.', {
          exact: true,
        }),
      ).toBeVisible();
      await expectJavaScriptDisabled(page);

      await page.getByRole('link', { name: 'Change the fictional eligibility answer' }).click();
      await expect(page).toHaveURL('/demo/support/eligibility/change');
      await expect(page.getByLabel(ineligibleLabel, { exact: true })).toBeChecked();
      await expect(page.getByRole('link', { name: 'Back' })).toHaveAttribute(
        'href',
        supportPaths.ineligible,
      );
    });
  });
});
