const { expect, test } = require('./fixtures');
const {
  caseworkPaths,
  getQueueFilter,
  getQueueTable,
  queueFilterPath,
  signInCaseworker,
} = require('./helpers/demo-casework');
const { VIEWPORTS } = require('./helpers/viewports');

const queueLabels = ['Unassigned', 'My requests', 'Completed'];

function getQueueTableRegion(page, label) {
  return page.locator('.app-casework-queue-table').filter({
    has: page.locator('caption').filter({ hasText: `${label} fictional requests` }),
  });
}

async function openCaseworkQueue(page) {
  await page.goto(caseworkPaths.signIn);
  await signInCaseworker(page);
}

async function expectDocumentWithinViewport(page) {
  const widths = await page.locator('html').evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    viewportWidth: element.ownerDocument.defaultView.innerWidth,
  }));

  expect(widths.clientWidth).toBe(widths.viewportWidth);
  expect(widths.scrollWidth, 'the queue page should not overflow horizontally').toBeLessThanOrEqual(
    widths.clientWidth,
  );
}

async function expectKeyboardScrollableTable(page, label) {
  const region = getQueueTableRegion(page, label);
  const table = getQueueTable(page, label);

  await expect(region).toBeVisible();
  await expect(region).toHaveAttribute('role', 'region');
  await expect(region).toHaveAttribute('aria-label', `${label} fictional requests`);
  await expect(region).toHaveAttribute('tabindex', '0');
  await expect(table).toHaveCount(1);
  await expect(table.getByRole('columnheader')).toHaveText([
    'Reference',
    'Applicant alias',
    'Received',
    'Urgency',
    'Status',
  ]);

  const initialDimensions = await region.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollLeft: element.scrollLeft,
    scrollWidth: element.scrollWidth,
  }));

  expect(initialDimensions.scrollLeft).toBe(0);
  expect(initialDimensions.scrollWidth).toBeGreaterThan(initialDimensions.clientWidth);

  await region.focus();
  await expect(region).toBeFocused();
  for (let keyPress = 0; keyPress < 40; keyPress += 1) {
    await page.keyboard.press('ArrowRight');
  }
  await expect
    .poll(() => region.evaluate((element) => element.scrollLeft))
    .toBeGreaterThanOrEqual(initialDimensions.scrollWidth - initialDimensions.clientWidth - 1);

  const finalColumnPosition = await region.evaluate((element) => {
    const finalColumn = element.querySelector('thead th:last-child');
    const regionBounds = element.getBoundingClientRect();
    const columnBounds = finalColumn.getBoundingClientRect();

    return {
      columnLeft: columnBounds.left,
      columnRight: columnBounds.right,
      regionLeft: regionBounds.left,
      regionRight: regionBounds.right,
    };
  });

  expect(finalColumnPosition.columnLeft).toBeGreaterThanOrEqual(finalColumnPosition.regionLeft);
  expect(finalColumnPosition.columnRight).toBeLessThanOrEqual(finalColumnPosition.regionRight + 1);
}

test.describe('caseworker queue responsive tables', () => {
  test.describe('at the mobile viewport', () => {
    test.use({ viewport: VIEWPORTS.mobile });

    test('contains and keyboard-scrolls every queue table independently', async ({ page }) => {
      await openCaseworkQueue(page);
      await expectDocumentWithinViewport(page);

      for (const label of queueLabels) {
        await expectKeyboardScrollableTable(page, label);
      }

      await expectDocumentWithinViewport(page);
    });
  });

  test.describe('at the desktop viewport', () => {
    test.use({ viewport: VIEWPORTS.desktop });

    test('preserves queue captions, tab panels and server-followable filters', async ({ page }) => {
      await openCaseworkQueue(page);
      await expectDocumentWithinViewport(page);

      for (const label of queueLabels) {
        const region = getQueueTableRegion(page, label);

        await expect(region).toContainText(`${label} fictional requests`);
        await expect(region.locator('table')).toHaveCount(1);
      }

      await expect(getQueueTable(page, 'Unassigned')).toBeVisible();
      await getQueueFilter(page).getByRole('link', { name: 'My requests', exact: true }).click();
      await expect(page).toHaveURL(queueFilterPath('my-requests'));
      await expect(getQueueTable(page, 'My requests')).toBeVisible();
      await expect(
        getQueueFilter(page).getByRole('link', { name: 'My requests', exact: true }),
      ).toHaveAttribute('aria-current', 'page');
      await expectDocumentWithinViewport(page);
    });
  });
});
