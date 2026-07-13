const request = require('supertest');
const { createApp } = require('../../src/app/app');
const { signInCaseworker } = require('./demo-casework');
const { chooseEligibility } = require('./demo-support');

const requestReference = 'DEMO-CW-1001';

function stateKey({ route, state }) {
  return `${route}::${state}`;
}

async function getRoute(agent, route) {
  return agent.get(route).expect(200);
}

const stateRenderers = new Map([
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
    '/demo/support/eligibility::invalid-submission',
    (agent, entry) => agent.post(entry.route).type('form').send({}).expect(400),
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
