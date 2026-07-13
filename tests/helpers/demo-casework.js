const { URLSearchParams } = require('node:url');
const request = require('supertest');
const { createApp } = require('../../src/app/app');

const caseworkPaths = Object.freeze({
  home: '/demo',
  signIn: '/demo/casework/sign-in',
  queue: '/demo/casework/queue',
  reset: '/demo/casework/reset',
});

const journeyRecord = Object.freeze({
  reference: 'DEMO-CW-2001',
  applicantAlias: 'Demo household Grove',
  evidenceFilename: 'demo-only-grove-review.pdf',
});

const validDecision = Object.freeze({
  decision: 'priority',
  caseNote: 'Fictional priority review completed.',
});

function withQueueContext(path, tab, page) {
  const query = new URLSearchParams({ tab, page: String(page) });
  return `${path}?${query}`;
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

function createCaseworkAgent() {
  return request.agent(createApp());
}

async function signInCaseworker(agent, password = 'fictional-caseworker-value') {
  await agent
    .post(caseworkPaths.signIn)
    .type('form')
    .send({ password })
    .expect(302)
    .expect('Location', caseworkPaths.queue);
}

async function createSignedInCaseworkAgent() {
  const agent = createCaseworkAgent();
  await signInCaseworker(agent);
  return agent;
}

async function recordDecision(
  agent,
  {
    reference = journeyRecord.reference,
    tab = 'my-requests',
    page = 1,
    decision = validDecision,
  } = {},
) {
  const formPath = decisionPath(reference, tab, page);
  const savedOutcomePath = outcomePath(reference, tab, page);

  await agent
    .post(formPath)
    .type('form')
    .send(decision)
    .expect(302)
    .expect('Location', savedOutcomePath);

  return savedOutcomePath;
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

function expectSelectedQueue(html, tab, label) {
  expect(html).toMatch(
    new RegExp(
      `<li class="govuk-tabs__list-item[^"]*govuk-tabs__list-item--selected[^"]*">\\s*<a class="govuk-tabs__tab" href="#casework-queue-${escapeRegExp(tab)}">\\s*${escapeRegExp(label)}\\s*</a>`,
    ),
  );
}

function getSelectedQueuePanel(html, tab) {
  const panel = html.match(
    new RegExp(
      `<div class="govuk-tabs__panel" id="casework-queue-${escapeRegExp(tab)}">([\\s\\S]*?)</div>\\s*(?:</div>|<div class="govuk-tabs__panel)`,
    ),
  );

  expect(panel).not.toBeNull();
  return panel[1];
}

module.exports = {
  caseworkPaths,
  createCaseworkAgent,
  createSignedInCaseworkAgent,
  decisionPath,
  expectBackLink,
  expectSelectedQueue,
  getSelectedQueuePanel,
  journeyRecord,
  outcomePath,
  queuePath,
  recordDecision,
  requestPath,
  signInCaseworker,
  validDecision,
};
