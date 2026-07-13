const { expect, test } = require('./fixtures');
const {
  chooseEligibility,
  expectTaskStatus,
  fillAboutYou,
  fillSupportNeeds,
  supportPaths,
} = require('./helpers/demo-support');
const { expectLogicalMainHeadingOrder } = require('./helpers/demo-content');
const { VIEWPORTS } = require('./helpers/viewports');

const eligibleLabel = 'Yes, continue to the fictional application tasks';

async function expectResponsiveReflow(page, viewportName) {
  const widths = await page.locator('html').evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    viewportWidth: element.ownerDocument.defaultView.innerWidth,
  }));

  expect(widths.clientWidth).toBe(widths.viewportWidth);
  expect(
    widths.scrollWidth,
    `${viewportName} layout should not overflow horizontally`,
  ).toBeLessThanOrEqual(widths.clientWidth);

  const mainContentBox = await page.locator('#main-content').boundingBox();

  expect(mainContentBox).not.toBeNull();
  expect(
    mainContentBox.x,
    `${viewportName} main content should start within the viewport`,
  ).toBeGreaterThanOrEqual(0);
  expect(
    mainContentBox.x + mainContentBox.width,
    `${viewportName} main content should end within the viewport`,
  ).toBeLessThanOrEqual(widths.viewportWidth);
}

async function expectAccessibleResponsiveState(page, makeAxeBuilder, viewportName) {
  await expectLogicalMainHeadingOrder(page);
  await expectResponsiveReflow(page, viewportName);

  const { violations } = await makeAxeBuilder().analyze();

  expect(violations).toEqual([]);
}

async function expectTaskItemStatus(page, taskName, status) {
  const taskItem = page.locator('.govuk-task-list__item').filter({ hasText: taskName });

  await expect(taskItem).toHaveCount(1);
  await expect(taskItem.locator('.govuk-task-list__status')).toHaveText(status);
}

for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`public support accessibility at the ${viewportName} viewport`, () => {
    test.use({ viewport });

    test('checks every named public state', async ({ makeAxeBuilder, page }) => {
      test.setTimeout(90_000);

      await test.step('start page', async () => {
        await page.goto(supportPaths.start);

        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
          'Request emergency housing support',
        );
        await expect(page.locator('#main-content').getByRole('heading', { level: 2 })).toHaveText([
          'What this fictional service covers',
          'Before you start',
        ]);
        await expectAccessibleResponsiveState(page, makeAxeBuilder, viewportName);
      });

      await test.step('task list and understandable statuses', async () => {
        await page.getByRole('button', { name: 'Start now' }).click();
        await chooseEligibility(page, eligibleLabel);
        await expect(page).toHaveURL(supportPaths.tasks);

        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Application tasks');
        await expectTaskItemStatus(page, 'About you', 'Not started');
        await expectTaskItemStatus(page, 'Support needs', 'Not started');
        await expectTaskItemStatus(page, 'Evidence', 'Not started');
        await expectTaskItemStatus(page, 'Check your answers', 'Cannot start yet');
        await expect(
          page
            .locator('.govuk-task-list__item')
            .filter({ hasText: 'Check your answers' })
            .getByRole('link'),
        ).toHaveCount(0);
        await expectAccessibleResponsiveState(page, makeAxeBuilder, viewportName);
      });

      await test.step('representative form labels and legend', async () => {
        await page.getByRole('link', { name: 'About you' }).click();

        await expect(page.getByRole('heading', { level: 1 })).toHaveText('About you');
        await expect(page.getByLabel('Fictional full name')).toBeVisible();
        await expect(page.getByRole('group', { name: 'Date of birth' })).toBeVisible();
        await expect(page.getByLabel('Day', { exact: true })).toBeVisible();
        await expect(page.getByLabel('Month', { exact: true })).toBeVisible();
        await expect(page.getByLabel('Year', { exact: true })).toBeVisible();
        await expect(page.getByLabel('Current country')).toBeVisible();
        await expectAccessibleResponsiveState(page, makeAxeBuilder, viewportName);
      });

      await test.step('completed check-answers state', async () => {
        await fillAboutYou(page);
        await page.getByRole('button', { name: 'Save and continue' }).click();

        await page.getByRole('link', { name: 'Support needs' }).click();
        await fillSupportNeeds(page);
        await page.getByRole('button', { name: 'Save and continue' }).click();

        await page.getByRole('link', { name: 'Evidence' }).click();
        await page.getByRole('button', { name: 'Save and continue' }).click();

        await expectTaskStatus(page, 'About you', 'Completed');
        await expectTaskStatus(page, 'Support needs', 'Completed');
        await expectTaskStatus(page, 'Evidence', 'Completed');
        await expectTaskStatus(page, 'Check your answers', 'Not started');

        await page.getByRole('link', { name: 'Check your answers' }).click();
        await expect(page).toHaveURL(supportPaths.checkAnswers);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Check your answers');
        await expect(page.locator('.govuk-summary-card')).toHaveCount(4);
        await expect(page.getByRole('link', { name: 'Change fictional full name' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Change supporting document' })).toBeVisible();
        await expectAccessibleResponsiveState(page, makeAxeBuilder, viewportName);
      });

      await test.step('confirmation state', async () => {
        await page.getByRole('button', { name: 'Submit fictional request' }).click();

        await expect(page).toHaveURL(supportPaths.confirmation);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
          'Fictional request submitted',
        );
        await expect(page.locator('.govuk-panel')).toContainText(/DEMO-[A-F0-9]{8}/);
        await expectAccessibleResponsiveState(page, makeAxeBuilder, viewportName);
      });
    });
  });
}
