const { expect, test } = require('./fixtures');
const {
  caseworkPaths,
  getQueueFilter,
  getQueueTable,
  journeyRecord,
  queueFilterPath,
  signInCaseworker,
} = require('./helpers/demo-casework');
const { expectLogicalMainHeadingOrder } = require('./helpers/demo-content');
const { VIEWPORTS } = require('./helpers/viewports');

const selectedTab = 'my-requests';

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

async function expectSurfaceWithinViewport(page, locator, viewportName, surfaceName) {
  const boxes = await locator.evaluateAll((elements) =>
    elements
      .filter((element) => element.getClientRects().length > 0)
      .map((element) => {
        const bounds = element.getBoundingClientRect();

        return { left: bounds.left, right: bounds.right };
      }),
  );
  const viewportWidth = await page
    .locator('html')
    .evaluate((element) => element.ownerDocument.defaultView.innerWidth);

  expect(boxes.length, `${surfaceName} should have a visible layout surface`).toBeGreaterThan(0);
  boxes.forEach(({ left, right }) => {
    expect(
      left,
      `${viewportName} ${surfaceName} should start within the viewport`,
    ).toBeGreaterThanOrEqual(0);
    expect(
      right,
      `${viewportName} ${surfaceName} should end within the viewport`,
    ).toBeLessThanOrEqual(viewportWidth);
  });
}

async function expectAccessibleResponsiveState(
  page,
  makeAxeBuilder,
  viewportName,
  responsiveSurface,
) {
  await expectLogicalMainHeadingOrder(page);
  await expectResponsiveReflow(page, viewportName);
  await expectSurfaceWithinViewport(
    page,
    responsiveSurface.locator,
    viewportName,
    responsiveSurface.name,
  );

  const { violations } = await makeAxeBuilder().analyze();

  expect(violations).toEqual([]);
}

function getQueueTableRegion(page, label) {
  return page.locator('.app-casework-queue-table').filter({
    has: page.locator('caption').filter({ hasText: `${label} fictional requests` }),
  });
}

for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`caseworker accessibility at the ${viewportName} viewport`, () => {
    test.use({ viewport });

    test('checks every named caseworker state', async ({ makeAxeBuilder, page }) => {
      test.setTimeout(90_000);

      await test.step('sign-in state', async () => {
        await page.goto(caseworkPaths.signIn);

        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
          'Sign in to the fictional casework queue',
        );
        await expect(page.getByLabel('Demonstration password')).toBeVisible();
        await expectAccessibleResponsiveState(page, makeAxeBuilder, viewportName, {
          name: 'sign-in form',
          locator: page.locator('#main-content form'),
        });
      });

      await test.step('queue state', async () => {
        await signInCaseworker(page);
        await getQueueFilter(page).getByRole('link', { name: 'My requests', exact: true }).click();

        await expect(page).toHaveURL(queueFilterPath(selectedTab));
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
          'Fictional support request queue',
        );
        await expect(getQueueTable(page, 'My requests')).toBeVisible();
        await expectAccessibleResponsiveState(page, makeAxeBuilder, viewportName, {
          name: 'casework queue table region',
          locator: getQueueTableRegion(page, 'My requests'),
        });
      });

      await test.step('request-detail state', async () => {
        const selectedRow = getQueueTable(page, 'My requests')
          .getByRole('row')
          .filter({ hasText: journeyRecord.reference });

        await selectedRow.getByRole('link', { name: journeyRecord.reference }).click();
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
          `Request ${journeyRecord.reference}`,
        );
        await expect(page.locator('.govuk-summary-card')).toHaveCount(2);
        await expectAccessibleResponsiveState(page, makeAxeBuilder, viewportName, {
          name: 'request summary cards',
          locator: page.locator('.govuk-summary-card'),
        });
      });

      await test.step('decision state', async () => {
        await page.getByRole('button', { name: 'Record a decision' }).click();

        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
          `Record a decision for ${journeyRecord.reference}`,
        );
        await expect(
          page.getByRole('group', {
            name: 'What demonstration decision do you want to record?',
          }),
        ).toBeVisible();
        await expect(page.getByLabel('Case note (optional)')).toBeVisible();
        await expectAccessibleResponsiveState(page, makeAxeBuilder, viewportName, {
          name: 'decision form',
          locator: page.locator('#main-content form'),
        });
      });

      await test.step('decision-outcome state', async () => {
        await page.getByLabel('Priority', { exact: true }).check();
        await page.getByRole('button', { name: 'Save demonstration decision' }).click();

        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
          `Fictional decision saved for ${journeyRecord.reference}`,
        );
        await expect(page.getByRole('alert')).toContainText(
          `Fictional request ${journeyRecord.reference} was recorded as Priority for this demonstration.`,
        );
        await expectAccessibleResponsiveState(page, makeAxeBuilder, viewportName, {
          name: 'decision outcome banner',
          locator: page.locator('.govuk-notification-banner'),
        });
      });
    });
  });
}
