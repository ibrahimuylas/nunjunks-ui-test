const request = require('supertest');
const { createApp } = require('../../src/app/app');
const { signInCaseworker } = require('./demo-casework');
const { chooseEligibility, completeAboutYou, completeRequiredSections } = require('./demo-support');

const requestReference = 'DEMO-CW-1001';

function stateKey({ route, state }) {
  return `${route}::${state}`;
}

async function getRoute(agent, route) {
  return agent.get(route).expect(200);
}

const stateRenderers = new Map([
  ['/demo::default', (agent, entry) => getRoute(agent, entry.route)],
  ['/demo/support/start::default', (agent, entry) => getRoute(agent, entry.route)],
  ['/demo/support/eligibility::default', (agent, entry) => getRoute(agent, entry.route)],
  [
    '/demo/casework/requests/:reference::request-details',
    async (agent, entry) => {
      await signInCaseworker(agent);
      const route = entry.route.replace(':reference', requestReference);

      return getRoute(agent, `${route}?tab=unassigned&page=1`);
    },
  ],
  [
    '/demo/support/support-needs::default',
    async (agent, entry) => {
      await chooseEligibility(agent);
      return getRoute(agent, entry.route);
    },
  ],
  ['/demo::first-visit', (agent, entry) => getRoute(agent, entry.route)],
  [
    '/demo/support/about-you::default',
    async (agent, entry) => {
      await chooseEligibility(agent);
      return getRoute(agent, entry.route);
    },
  ],
  [
    '/demo/support/evidence::default',
    async (agent, entry) => {
      await chooseEligibility(agent);
      return getRoute(agent, entry.route);
    },
  ],
  [
    '/demo/support/eligibility::invalid-submission',
    (agent, entry) => agent.post(entry.route).type('form').send({}).expect(400),
  ],
  [
    '/demo/casework/queue::newly-assigned',
    async (agent, entry) => {
      await signInCaseworker(agent);
      return getRoute(agent, entry.route);
    },
  ],
  [
    '/demo/casework/queue?tab=unassigned&page=2::paginated',
    async (agent, entry) => {
      await signInCaseworker(agent);
      return getRoute(agent, entry.route);
    },
  ],
  [
    '/demo/support/confirmation::submitted',
    async (agent, entry) => {
      await chooseEligibility(agent);
      await completeRequiredSections(agent);
      await agent.post('/demo/support/check-answers').expect(302).expect('Location', entry.route);

      return getRoute(agent, entry.route);
    },
  ],
  ['/demo/casework/sign-in::default', (agent, entry) => getRoute(agent, entry.route)],
  [
    '/demo/support/check-answers::default',
    async (agent, entry) => {
      await chooseEligibility(agent);
      await completeRequiredSections(agent);

      return getRoute(agent, entry.route);
    },
  ],
  [
    '/demo/casework/queue::unassigned',
    async (agent, entry) => {
      await signInCaseworker(agent);
      return getRoute(agent, entry.route);
    },
  ],
  [
    '/demo/support/tasks::mixed-statuses',
    async (agent, entry) => {
      await chooseEligibility(agent);
      await completeAboutYou(agent);
      await getRoute(agent, '/demo/support/support-needs');

      return getRoute(agent, entry.route);
    },
  ],
]);

async function renderDemoComponentState(entry) {
  const renderer = stateRenderers.get(stateKey(entry));

  if (!renderer) {
    throw new Error(
      `No real-route setup is defined for ${entry.component} at ${entry.route} (${entry.state})`,
    );
  }

  return renderer(request.agent(createApp()), entry);
}

module.exports = { renderDemoComponentState };
