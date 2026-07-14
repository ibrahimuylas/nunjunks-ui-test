const { Buffer } = require('node:buffer');
const request = require('supertest');
const { createApp } = require('../../src/app/app');

const supportPaths = Object.freeze({
  home: '/demo',
  start: '/demo/support/start',
  eligibility: '/demo/support/eligibility',
  eligibilityChange: '/demo/support/eligibility/change',
  ineligible: '/demo/support/ineligible',
  tasks: '/demo/support/tasks',
  aboutYou: '/demo/support/about-you',
  aboutYouChange: '/demo/support/about-you/change',
  supportNeeds: '/demo/support/support-needs',
  supportNeedsChange: '/demo/support/support-needs/change',
  evidence: '/demo/support/evidence',
  evidenceChange: '/demo/support/evidence/change',
  checkAnswers: '/demo/support/check-answers',
  confirmation: '/demo/support/confirmation',
  startAnother: '/demo/support/start-another',
  reset: '/demo/support/reset',
});

const validAboutYou = Object.freeze({
  fullName: 'Alex Example',
  'dateOfBirth-day': '7',
  'dateOfBirth-month': '9',
  'dateOfBirth-year': '1990',
  country: 'scotland',
});

const validSupportNeeds = Object.freeze({
  supportTypes: ['safe-accommodation', 'wellbeing'],
  description: 'A fictional support description',
  additionalInformation: 'Fictional follow-up details',
});

function createSupportAgent() {
  return request.agent(createApp());
}

async function chooseEligibility(agent, eligibility = 'eligible') {
  const location = eligibility === 'eligible' ? supportPaths.tasks : supportPaths.ineligible;

  await agent
    .post(supportPaths.eligibility)
    .type('form')
    .send({ eligibility })
    .expect(302)
    .expect('Location', location);
}

async function completeAboutYou(agent, overrides = {}, path = supportPaths.aboutYou) {
  await agent
    .post(path)
    .type('form')
    .send({ ...validAboutYou, ...overrides })
    .expect(302)
    .expect(
      'Location',
      path === supportPaths.aboutYou ? supportPaths.tasks : supportPaths.checkAnswers,
    );
}

async function completeSupportNeeds(agent, overrides = {}, path = supportPaths.supportNeeds) {
  await agent
    .post(path)
    .type('form')
    .send({ ...validSupportNeeds, ...overrides })
    .expect(302)
    .expect(
      'Location',
      path === supportPaths.supportNeeds ? supportPaths.tasks : supportPaths.checkAnswers,
    );
}

async function completeEvidence(
  agent,
  {
    filename = 'fictional-support-evidence.pdf',
    contentType = 'application/pdf',
    contents = 'fictional file contents that must be discarded',
    path = supportPaths.evidence,
  } = {},
) {
  await agent
    .post(path)
    .attach('evidence', Buffer.from(contents), { filename, contentType })
    .expect(302)
    .expect(
      'Location',
      path === supportPaths.evidence ? supportPaths.tasks : supportPaths.checkAnswers,
    );
}

async function completeEvidenceWithoutFile(agent, path = supportPaths.evidence) {
  await agent
    .post(path)
    .set('Content-Type', 'multipart/form-data; boundary=empty-evidence')
    .send('--empty-evidence--\r\n')
    .expect(302)
    .expect(
      'Location',
      path === supportPaths.evidence ? supportPaths.tasks : supportPaths.checkAnswers,
    );
}

async function completeRequiredSections(agent) {
  await completeAboutYou(agent);
  await completeSupportNeeds(agent);
  await completeEvidence(agent);
}

async function createCompletedSupportAgent() {
  const agent = createSupportAgent();

  await chooseEligibility(agent);
  await completeRequiredSections(agent);

  return agent;
}

function extractReference(html) {
  return html.match(/DEMO-[A-F0-9]{8}/)?.[0] || null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function expectBackLink(html, href) {
  expect(html).toMatch(
    new RegExp(
      `<a\\b(?=[^>]*href="${escapeRegExp(href)}")(?=[^>]*class="[^"]*\\bgovuk-back-link\\b[^"]*")[^>]*>`,
    ),
  );
}

function getTaskItem(html, title) {
  const items = html.match(/<li class="govuk-task-list__item[^"]*">[\s\S]*?<\/li>/g) || [];
  const item = items.find((candidate) => candidate.includes(title));

  expect(item).toBeDefined();
  return item;
}

function expectTaskStatus(html, title, status, href = null) {
  const item = getTaskItem(html, title);

  expect(item).toMatch(new RegExp(`>\\s*${escapeRegExp(status)}\\s*<\\/strong>`));

  if (href) {
    expect(item).toContain(`href="${href}"`);
  } else {
    expect(item).not.toContain('govuk-task-list__link');
  }
}

module.exports = {
  chooseEligibility,
  completeAboutYou,
  completeEvidence,
  completeEvidenceWithoutFile,
  completeRequiredSections,
  completeSupportNeeds,
  createCompletedSupportAgent,
  createSupportAgent,
  expectBackLink,
  expectTaskStatus,
  extractReference,
  supportPaths,
  validAboutYou,
  validSupportNeeds,
};
