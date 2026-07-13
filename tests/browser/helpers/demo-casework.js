const { URLSearchParams } = require('node:url');
const { expect } = require('../fixtures');

const caseworkPaths = Object.freeze({
  signIn: '/demo/casework/sign-in',
  queue: '/demo/casework/queue',
});

const journeyRecord = Object.freeze({
  reference: 'DEMO-CW-2001',
  applicantAlias: 'Demo household Grove',
  receivedDate: '9 July 2026',
  urgency: 'High',
  evidenceFilename: 'demo-only-grove-review.pdf',
});

function withQueueContext(path, tab, page) {
  const query = new URLSearchParams({ tab, page: String(page) });
  return `${path}?${query}`;
}

function queueFilterPath(tab) {
  return `${caseworkPaths.queue}?tab=${encodeURIComponent(tab)}`;
}

function queuePath(tab, page) {
  return withQueueContext(caseworkPaths.queue, tab, page);
}

function requestPath(reference, tab, page) {
  return withQueueContext(`/demo/casework/requests/${encodeURIComponent(reference)}`, tab, page);
}

function decisionPath(reference, tab, page) {
  return withQueueContext(
    `/demo/casework/requests/${encodeURIComponent(reference)}/decision`,
    tab,
    page,
  );
}

function outcomePath(reference, tab, page) {
  return withQueueContext(
    `/demo/casework/requests/${encodeURIComponent(reference)}/decision/outcome`,
    tab,
    page,
  );
}

function getQueueFilter(page) {
  return page.getByRole('navigation', { name: 'Filter fictional requests' });
}

function getQueueTable(page, label) {
  return page.getByRole('table', { name: `${label} fictional requests` });
}

async function expectJavaScriptDisabled(page) {
  const body = page.locator('body');

  await expect(body).not.toHaveClass(/\bjs-enabled\b/);
  await expect(body).not.toHaveClass(/\bgovuk-frontend-supported\b/);
}

async function expectSelectedQueue(page, label) {
  await expect(
    getQueueFilter(page).getByRole('link', { name: label, exact: true }),
  ).toHaveAttribute('aria-current', 'page');
}

async function startCaseworkJourney(page) {
  const response = await page.goto(caseworkPaths.signIn);

  expect(response).not.toBeNull();
  expect(response.ok()).toBe(true);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Sign in to the fictional casework queue',
  );
  await expect(page.getByText('It is not real authentication.', { exact: false })).toBeVisible();
  await expect(page.getByText('Do not use a real password.', { exact: false })).toBeVisible();
  await expectJavaScriptDisabled(page);
}

async function signInCaseworker(page, password = 'fictional-caseworker-value') {
  await page.getByLabel('Demonstration password').fill(password);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(caseworkPaths.queue);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Fictional support request queue',
  );
}

module.exports = {
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
};
