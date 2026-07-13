const { expect } = require('../fixtures');

const supportPaths = Object.freeze({
  start: '/demo/support/start',
  eligibility: '/demo/support/eligibility',
  ineligible: '/demo/support/ineligible',
  tasks: '/demo/support/tasks',
  aboutYou: '/demo/support/about-you',
  supportNeeds: '/demo/support/support-needs',
  evidence: '/demo/support/evidence',
  checkAnswers: '/demo/support/check-answers',
  confirmation: '/demo/support/confirmation',
});

const validAboutYou = Object.freeze({
  fullName: 'Alex Example',
  day: '7',
  month: '9',
  year: '1990',
  country: 'scotland',
});

const validSupportNeeds = Object.freeze({
  description: 'A fictional support description',
  additionalInformation: 'Fictional follow-up details',
});

async function expectJavaScriptDisabled(page) {
  const body = page.locator('body');

  await expect(body).not.toHaveClass(/\bjs-enabled\b/);
  await expect(body).not.toHaveClass(/\bgovuk-frontend-supported\b/);
}

async function startSupportJourney(page) {
  const response = await page.goto(supportPaths.start);

  expect(response).not.toBeNull();
  expect(response.ok()).toBe(true);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Request emergency housing support',
  );
  await expect(
    page.getByText('This is a fictional demonstration. Do not enter real personal information.', {
      exact: true,
    }),
  ).toBeVisible();
  await expectJavaScriptDisabled(page);

  await page.getByRole('button', { name: 'Start now' }).click();
  await expect(page).toHaveURL(supportPaths.eligibility);
}

async function chooseEligibility(page, label) {
  await page.getByLabel(label, { exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function fillAboutYou(page, values = {}) {
  const answers = { ...validAboutYou, ...values };

  await page.getByLabel('Fictional full name').fill(answers.fullName);
  await page.locator('#dateOfBirth-day').fill(answers.day);
  await page.locator('#dateOfBirth-month').fill(answers.month);
  await page.locator('#dateOfBirth-year').fill(answers.year);
  await page.getByLabel('Current country').selectOption(answers.country);
}

async function fillSupportNeeds(page, values = {}) {
  const answers = { ...validSupportNeeds, ...values };

  await page.getByLabel('Somewhere safe to stay', { exact: true }).check();
  await page.getByLabel('Health and wellbeing support', { exact: true }).check();
  await page.getByLabel('Describe the fictional support needed').fill(answers.description);
  await page.getByLabel('Additional information (optional)').fill(answers.additionalInformation);
}

async function expectTaskStatus(page, taskName, status) {
  const item = page.locator('.govuk-task-list__item').filter({ hasText: taskName });

  await expect(item).toContainText(status);
}

module.exports = {
  chooseEligibility,
  expectJavaScriptDisabled,
  expectTaskStatus,
  fillAboutYou,
  fillSupportNeeds,
  startSupportJourney,
  supportPaths,
  validAboutYou,
  validSupportNeeds,
};
