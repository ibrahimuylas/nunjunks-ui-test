const { expect, test } = require('./fixtures');
const {
  caseworkPaths,
  decisionPath,
  expectJavaScriptDisabled,
  expectSelectedQueue,
  getQueueFilter,
  getQueueTable,
  journeyRecord,
  outcomePath,
  queueFilterPath,
  queuePath,
  requestPath,
  signInCaseworker,
  startCaseworkJourney,
} = require('./helpers/demo-casework');
const { VIEWPORTS } = require('./helpers/viewports');

const selectedTab = 'my-requests';
const selectedPage = 1;
const expectedValidationConsoleMessages = [
  caseworkPaths.signIn,
  decisionPath(journeyRecord.reference, selectedTab, selectedPage),
].map(
  (path) =>
    `console.error: Failed to load resource: the server responded with a status of 400 (Bad Request) (http://[::1]:3000${path}:1:1)`,
);

test.describe('caseworker journey without JavaScript', () => {
  test.use({
    allowedConsoleMessages: expectedValidationConsoleMessages,
    javaScriptEnabled: false,
  });

  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    test.describe(`at a ${viewportName} viewport`, () => {
      test.use({ viewport });

      test('filters, paginates, reviews and decides within the same session', async ({ page }) => {
        // This deliberately repeats the complete journey at both representative
        // widths so responsive CSS cannot hide a server-rendered fallback.
        test.setTimeout(60_000);

        await startCaseworkJourney(page);

        await page.getByRole('button', { name: 'Continue' }).click();
        await expect(page.getByRole('alert')).toContainText('There is a problem');
        await expect(page.getByRole('alert')).toContainText('Enter a demonstration password');
        await expect(page.locator('#password-error')).toContainText(
          'Enter a demonstration password',
        );
        await expect(page.getByLabel('Demonstration password')).toHaveValue('');
        await expectJavaScriptDisabled(page);

        await signInCaseworker(page);
        const newWorkBanner = page.getByRole('region', { name: 'New fictional work' });
        await expect(newWorkBanner).toContainText('New fictional work');
        await expect(newWorkBanner).toContainText(
          '6 newly assigned fictional requests are available in My requests.',
        );
        await expectSelectedQueue(page, 'Unassigned');
        await expect(page.locator('.govuk-tabs')).not.toHaveAttribute('data-govuk-tabs-init', '');

        // Without the tabs enhancement every panel remains readable, while these
        // ordinary links make the chosen queue state server-followable.
        await expect(page.locator('.govuk-tabs__panel')).toHaveCount(3);
        for (const label of ['Unassigned', 'My requests', 'Completed']) {
          await expect(getQueueTable(page, label)).toBeVisible();
          await expect(
            getQueueFilter(page).getByRole('link', { name: label, exact: true }),
          ).toHaveAttribute('href', queueFilterPath(label.toLowerCase().replace(' ', '-')));
        }

        await getQueueFilter(page).getByRole('link', { name: 'My requests', exact: true }).click();
        await expect(page).toHaveURL(queueFilterPath(selectedTab));
        await expectSelectedQueue(page, 'My requests');

        let selectedTable = getQueueTable(page, 'My requests');
        await expect(selectedTable).toContainText(journeyRecord.reference);
        await expect(selectedTable).not.toContainText('DEMO-CW-2006');

        const pagination = page.getByRole('navigation', {
          name: 'My requests fictional requests pagination',
        });
        await pagination.getByRole('link', { name: 'Page 2', exact: true }).click();
        await expect(page).toHaveURL(queuePath(selectedTab, 2));
        await expectSelectedQueue(page, 'My requests');
        selectedTable = getQueueTable(page, 'My requests');
        await expect(selectedTable).toContainText('DEMO-CW-2006');
        await expect(selectedTable).not.toContainText(journeyRecord.reference);

        await page
          .getByRole('navigation', { name: 'My requests fictional requests pagination' })
          .getByRole('link', { name: 'Previous page' })
          .click();
        await expect(page).toHaveURL(queuePath(selectedTab, selectedPage));

        selectedTable = getQueueTable(page, 'My requests');
        const selectedRow = selectedTable
          .getByRole('row')
          .filter({ hasText: journeyRecord.reference });
        await expect(selectedRow).toContainText(journeyRecord.applicantAlias);
        await expect(selectedRow).toContainText(journeyRecord.receivedDate);
        await expect(selectedRow).toContainText(journeyRecord.urgency);
        await expect(selectedRow).toContainText('Assigned');
        await selectedRow.getByRole('link', { name: journeyRecord.reference }).click();

        await expect(page).toHaveURL(
          requestPath(journeyRecord.reference, selectedTab, selectedPage),
        );
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
          `Request ${journeyRecord.reference}`,
        );
        await expect(page.locator('.govuk-caption-xl')).toHaveText(journeyRecord.applicantAlias);
        await expect(page.getByText(journeyRecord.evidenceFilename, { exact: true })).toBeVisible();
        await page.getByText('View audit information', { exact: true }).click();
        await expect(
          page.getByText('Assigned to the current fictional caseworker for demonstration.', {
            exact: true,
          }),
        ).toBeVisible();
        await expectJavaScriptDisabled(page);

        await page.getByRole('button', { name: 'Record a decision' }).click();
        const savedDecisionPath = decisionPath(journeyRecord.reference, selectedTab, selectedPage);
        await expect(page).toHaveURL(savedDecisionPath);
        await expect(page.getByRole('link', { name: 'Back' })).toHaveAttribute(
          'href',
          requestPath(journeyRecord.reference, selectedTab, selectedPage),
        );
        await expect(
          page.getByText('Saving will move this fictional request to Completed'),
        ).toBeVisible();

        const caseNote = 'Recovered fictional decision without JavaScript.';
        await page.getByLabel('Case note (optional)').fill(caseNote);
        await page.getByRole('button', { name: 'Save demonstration decision' }).click();
        await expect(page.getByRole('alert')).toContainText('There is a problem');
        await expect(page.getByRole('alert')).toContainText('Select a demonstration decision');
        await expect(page.locator('#decision-error')).toContainText(
          'Select a demonstration decision',
        );
        await expect(page.getByLabel('Case note (optional)')).toHaveValue(caseNote);

        await page.getByLabel('Priority', { exact: true }).check();
        await page.getByRole('button', { name: 'Save demonstration decision' }).click();
        await expect(page).toHaveURL(
          outcomePath(journeyRecord.reference, selectedTab, selectedPage),
        );
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
          `Fictional decision saved for ${journeyRecord.reference}`,
        );
        await expect(page.getByRole('alert')).toContainText(
          `Fictional request ${journeyRecord.reference} was recorded as Priority for this demonstration.`,
        );
        await expectJavaScriptDisabled(page);

        await page
          .getByRole('link', { name: 'Return to the same fictional request queue' })
          .click();
        await expect(page).toHaveURL(queuePath(selectedTab, selectedPage));
        await expectSelectedQueue(page, 'My requests');
        await expect(getQueueTable(page, 'My requests')).not.toContainText(journeyRecord.reference);

        // The persisted record has moved queues, so the changed status is proved
        // from a second server-rendered response in this same browser session.
        await getQueueFilter(page).getByRole('link', { name: 'Completed', exact: true }).click();
        await expect(page).toHaveURL(queueFilterPath('completed'));
        await expectSelectedQueue(page, 'Completed');
        const completedRow = getQueueTable(page, 'Completed')
          .getByRole('row')
          .filter({ hasText: journeyRecord.reference });
        await expect(completedRow).toContainText(journeyRecord.applicantAlias);
        await expect(completedRow).toContainText('Priority');
      });
    });
  }
});
