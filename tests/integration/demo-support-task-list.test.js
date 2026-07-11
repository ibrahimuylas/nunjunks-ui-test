const request = require('supertest');
const { createApp } = require('../../src/app/app');

const guardedSectionPaths = [
  '/demo/support/tasks',
  '/demo/support/about-you',
  '/demo/support/support-needs',
  '/demo/support/evidence',
  '/demo/support/check-answers',
];

async function chooseEligibility(agent, eligibility) {
  await agent.post('/demo/support/eligibility').type('form').send({ eligibility }).expect(302);
}

describe('demo support task list and access guards', () => {
  test('renders the initially reachable task state for an eligible visitor', async () => {
    const agent = request.agent(createApp());
    await chooseEligibility(agent, 'eligible');

    const response = await agent.get('/demo/support/tasks').expect(200);

    expect(response.text.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(response.text).toContain('Application tasks');
    expect(response.text).toMatch(/<ul\b[^>]*class="[^"]*\bgovuk-task-list\b[^"]*"/);
    expect(response.text.match(/class="govuk-task-list__item(?: |")/g)).toHaveLength(4);
    expect(response.text).toContain('About you');
    expect(response.text).toContain('Support needs');
    expect(response.text).toContain('Evidence');
    expect(response.text).toContain('Check your answers');
    expect(response.text.match(/>\s*Not started\s*<\/strong>/g)).toHaveLength(3);
    expect(response.text).toMatch(
      /<strong\b[^>]*class="[^"]*\bgovuk-tag--grey\b[^"]*"[^>]*>\s*Cannot start yet\s*<\/strong>/,
    );

    for (const path of guardedSectionPaths.slice(1, 4)) {
      expect(response.text).toMatch(
        new RegExp(
          `<a\\b(?=[^>]*href="${path}")(?=[^>]*class="[^"]*\\bgovuk-task-list__link\\b[^"]*")[^>]*>`,
        ),
      );
    }

    expect(response.text).not.toMatch(
      /<a\b(?=[^>]*href="\/demo\/support\/check-answers")(?=[^>]*class="[^"]*\bgovuk-task-list__link\b)/,
    );
    expect(response.text).toMatch(
      /<a\b(?=[^>]*href="\/demo\/support\/eligibility")(?=[^>]*class="[^"]*\bgovuk-back-link\b[^"]*")[^>]*>/,
    );
  });

  test.each(guardedSectionPaths)(
    'redirects %s to eligibility when the branch answer is missing',
    async (path) => {
      await request(createApp())
        .get(path)
        .expect(302)
        .expect('Location', '/demo/support/eligibility');
    },
  );

  test.each(guardedSectionPaths)(
    'redirects %s to the configured outcome for an ineligible visitor',
    async (path) => {
      const agent = request.agent(createApp());
      await chooseEligibility(agent, 'ineligible');

      await agent.get(path).expect(302).expect('Location', '/demo/support/ineligible');
    },
  );

  test.each(['get', 'post'])(
    'redirects a %s check-answers skip attempt to the first incomplete section',
    async (method) => {
      const agent = request.agent(createApp());
      await chooseEligibility(agent, 'eligible');

      await agent[method]('/demo/support/check-answers')
        .expect(302)
        .expect('Location', '/demo/support/about-you');
    },
  );
});
