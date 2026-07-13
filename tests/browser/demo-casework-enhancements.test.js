const { expect, test } = require('./fixtures');
const {
  caseworkPaths,
  decisionPath,
  getQueueFilter,
  getQueueTable,
  journeyRecord,
  outcomePath,
  queueFilterPath,
  queuePath,
  signInCaseworker,
} = require('./helpers/demo-casework');

const selectedTab = 'my-requests';
const selectedPage = 1;
const expectedValidationConsoleMessages = [
  caseworkPaths.signIn,
  decisionPath(journeyRecord.reference, selectedTab, selectedPage),
].map(
  (path) =>
    `console.error: Failed to load resource: the server responded with a status of 400 (Bad Request) (http://[::1]:3000${path}:1:1)`,
);

async function expectGovukKeyboardFocus(locator) {
  await expect(locator).toBeFocused();
  await expect(locator).toHaveCSS('background-color', 'rgb(255, 221, 0)');
  await expect(locator).toHaveCSS('color', 'rgb(11, 12, 12)');
}

async function openCaseworkQueue(page) {
  await page.goto(caseworkPaths.signIn);
  await signInCaseworker(page);
  await expect(page.locator('body')).toHaveClass(/\bjs-enabled\b/);
  await expect(page.locator('body')).toHaveClass(/\bgovuk-frontend-supported\b/);
}

test.describe('caseworker progressive enhancements', () => {
  test.use({ allowedConsoleMessages: expectedValidationConsoleMessages });

  test('operates password visibility and sign-in errors from the keyboard', async ({ page }) => {
    await page.goto(caseworkPaths.signIn);

    const passwordInput = page.getByLabel('Demonstration password');
    const passwordComponent = page.locator('[data-module="govuk-password-input"]');

    await expect(passwordComponent).toHaveAttribute('data-govuk-password-input-init', '');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await passwordInput.fill('made-up-caseworker-value');
    await passwordInput.focus();
    await page.keyboard.press('Tab');

    const showPassword = page.getByRole('button', { name: 'Show password' });

    await expectGovukKeyboardFocus(showPassword);
    await page.keyboard.press('Enter');

    const hidePassword = page.getByRole('button', { name: 'Hide password' });
    const passwordStatus = passwordComponent.locator('.govuk-password-input__sr-status');

    await expect(hidePassword).toBeFocused();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await expect(passwordStatus).toHaveAttribute('aria-live', 'polite');
    await expect(passwordStatus).toHaveText('Your password is visible');

    await page.keyboard.press('Space');
    await expect(showPassword).toBeFocused();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordStatus).toHaveText('Your password is hidden');

    await passwordInput.fill('');
    const continueButton = page.getByRole('button', { name: 'Continue' });

    await continueButton.focus();
    await expectGovukKeyboardFocus(continueButton);
    await page.keyboard.press('Enter');

    const errorSummary = page.locator('.govuk-error-summary');
    const errorLink = errorSummary.getByRole('link', {
      name: 'Enter a demonstration password',
    });

    await expect(errorSummary).toHaveAttribute('data-govuk-error-summary-init', '');
    await expect(errorSummary).toBeFocused();
    await page.keyboard.press('Tab');
    await expectGovukKeyboardFocus(errorLink);
    await page.keyboard.press('Enter');
    await expect(passwordInput).toBeFocused();

    await passwordInput.fill('recovered-made-up-value');
    await page.keyboard.press('Tab');
    await expect(showPassword).toBeFocused();
    await page.keyboard.press('Tab');
    await expectGovukKeyboardFocus(continueButton);
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(caseworkPaths.queue);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Fictional support request queue',
    );
  });

  test('switches queue tabs with arrow keys and exposes status text', async ({ page }) => {
    await openCaseworkQueue(page);

    const tabs = page.locator('.govuk-tabs');
    const unassignedTab = page.getByRole('tab', { name: 'Unassigned', exact: true });
    const myRequestsTab = page.getByRole('tab', { name: 'My requests', exact: true });
    const completedTab = page.getByRole('tab', { name: 'Completed', exact: true });
    const queueBanner = page.getByRole('region', { name: 'New fictional work' });

    await expect(queueBanner).toHaveAttribute('data-govuk-notification-banner-init', '');
    await expect(queueBanner).not.toBeFocused();
    await expect(queueBanner).toContainText(
      '6 newly assigned fictional requests are available in My requests.',
    );
    await expect(tabs).toHaveAttribute('data-govuk-tabs-init', '');
    await expect(tabs.getByRole('tablist')).toBeVisible();
    await expect(unassignedTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#casework-queue-unassigned')).toBeVisible();
    await expect(page.locator('#casework-queue-my-requests')).toBeHidden();
    await expect(page.locator('#casework-queue-completed')).toBeHidden();

    // The ordinary links remain server-followable when the tabs enhancement is unavailable.
    for (const [label, tab] of [
      ['Unassigned', 'unassigned'],
      ['My requests', 'my-requests'],
      ['Completed', 'completed'],
    ]) {
      await expect(
        getQueueFilter(page).getByRole('link', { name: label, exact: true }),
      ).toHaveAttribute('href', queueFilterPath(tab));
    }

    await unassignedTab.focus();
    await expectGovukKeyboardFocus(unassignedTab);
    await page.keyboard.press('ArrowRight');

    await expectGovukKeyboardFocus(myRequestsTab);
    await expect(myRequestsTab).toHaveAttribute('aria-selected', 'true');
    await expect(unassignedTab).toHaveAttribute('aria-selected', 'false');
    await expect(page).toHaveURL(/#casework-queue-my-requests$/);
    await expect(page.locator('#casework-queue-unassigned')).toBeHidden();
    await expect(page.locator('#casework-queue-my-requests')).toBeVisible();
    await expect(getQueueTable(page, 'My requests').getByRole('columnheader')).toHaveText([
      'Reference',
      'Applicant alias',
      'Received',
      'Urgency',
      'Status',
    ]);
    await expect(getQueueTable(page, 'My requests').locator('.govuk-tag')).toHaveText([
      'Assigned',
      'Assigned',
      'Assigned',
      'Assigned',
      'Assigned',
    ]);

    await page.keyboard.press('ArrowRight');
    await expectGovukKeyboardFocus(completedTab);
    await expect(completedTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#casework-queue-completed')).toBeVisible();
    await expect(getQueueTable(page, 'Completed').locator('.govuk-tag')).toHaveText([
      'Priority',
      'Standard',
      'More information needed',
      'Priority',
      'Standard',
    ]);

    await page.keyboard.press('ArrowLeft');
    await expectGovukKeyboardFocus(myRequestsTab);
    await expect(myRequestsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('focuses decision errors and the saved notification before keyboard return', async ({
    page,
  }) => {
    await openCaseworkQueue(page);

    const savedDecisionPath = decisionPath(journeyRecord.reference, selectedTab, selectedPage);

    await page.goto(savedDecisionPath);
    await page
      .getByLabel('Case note (optional)')
      .fill('Keyboard and focus verification for a fictional decision.');

    const saveButton = page.getByRole('button', { name: 'Save demonstration decision' });

    await saveButton.focus();
    await expectGovukKeyboardFocus(saveButton);
    await page.keyboard.press('Enter');

    const errorSummary = page.locator('.govuk-error-summary');
    const errorLink = errorSummary.getByRole('link', {
      name: 'Select a demonstration decision',
    });

    await expect(errorSummary).toHaveAttribute('data-govuk-error-summary-init', '');
    await expect(errorSummary).toBeFocused();
    await expect(page.getByLabel('Case note (optional)')).toHaveValue(
      'Keyboard and focus verification for a fictional decision.',
    );
    await page.keyboard.press('Tab');
    await expectGovukKeyboardFocus(errorLink);
    await page.keyboard.press('Enter');

    const priorityDecision = page.getByLabel('Priority', { exact: true });

    await expect(priorityDecision).toBeFocused();
    await page.keyboard.press('Space');
    await expect(priorityDecision).toBeChecked();
    await saveButton.focus();
    await expectGovukKeyboardFocus(saveButton);
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(outcomePath(journeyRecord.reference, selectedTab, selectedPage));

    const successBanner = page.getByRole('alert');

    await expect(successBanner).toHaveClass(/\bgovuk-notification-banner--success\b/);
    await expect(successBanner).toHaveAttribute('data-govuk-notification-banner-init', '');
    await expect(successBanner).toBeFocused();
    await expect(successBanner).toContainText(
      `Request ${journeyRecord.reference} was recorded as Priority.`,
    );

    const returnLink = page.getByRole('link', {
      name: 'Return to the same fictional request queue',
    });

    await page.keyboard.press('Tab');
    await expectGovukKeyboardFocus(returnLink);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(queuePath(selectedTab, selectedPage));
    await expect(getQueueTable(page, 'My requests')).not.toContainText(journeyRecord.reference);

    await getQueueFilter(page).getByRole('link', { name: 'Completed', exact: true }).click();
    await expect(page).toHaveURL(queueFilterPath('completed'));

    const completedRow = getQueueTable(page, 'Completed')
      .getByRole('row')
      .filter({ hasText: journeyRecord.reference });

    await expect(completedRow).toContainText(journeyRecord.applicantAlias);
    await expect(completedRow.locator('.govuk-tag')).toHaveText('Priority');
  });
});
