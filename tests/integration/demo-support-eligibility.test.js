const request = require('supertest');
const { createApp } = require('../../src/app/app');

function expectRadioChecked(html, value) {
  expect(html).toMatch(new RegExp(`<input\\b(?=[^>]*value="${value}")(?=[^>]*checked)[^>]*>`));
}

describe('demo support eligibility', () => {
  test('renders a fictional radios question, hint, fieldset and back link', async () => {
    const response = await request(createApp()).get('/demo/support/eligibility').expect(200);

    expect(response.text.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(response.text).toContain('Can this fictional support request continue?');
    expect(response.text).toMatch(/<fieldset\b[^>]*class="[^"]*\bgovuk-fieldset\b[^"]*"[^>]*>/);
    expect(response.text).toMatch(
      /<div\b[^>]*id="eligibility-hint"[^>]*class="[^"]*\bgovuk-hint\b/,
    );
    expect(response.text).toContain('It is not an eligibility decision for a real service.');
    expect(response.text).toMatch(
      /<a\b(?=[^>]*href="\/demo\/support\/start")(?=[^>]*class="[^"]*\bgovuk-back-link\b[^"]*")[^>]*>/,
    );
    expect(response.text).toMatch(
      /<form\b(?=[^>]*method="post")(?=[^>]*action="\/demo\/support\/eligibility")(?=[^>]*novalidate)[^>]*>/,
    );
    expect(response.text).toContain('value="eligible"');
    expect(response.text).toContain('value="ineligible"');
  });

  test.each([
    ['an empty value', {}],
    ['an unknown value', { eligibility: 'unknown' }],
  ])('renders linked summary and field errors for %s', async (description, form) => {
    const response = await request(createApp())
      .post('/demo/support/eligibility')
      .type('form')
      .send(form)
      .expect(400);

    expect(response.text).toContain('Error: Can this fictional support request continue?');
    expect(response.text).toMatch(/<div\b[^>]*class="[^"]*\bgovuk-error-summary\b/);
    expect(response.text).toMatch(
      /<a\b[^>]*href="#eligibility"[^>]*>\s*Select whether the fictional request is eligible to continue\s*<\/a>/,
    );
    expect(response.text).toMatch(
      /<p\b[^>]*id="eligibility-error"[^>]*class="[^"]*\bgovuk-error-message\b/,
    );
    expect(response.text).toContain('Select whether the fictional request is eligible to continue');
  });

  test.each([
    ['eligible', '/demo/support/tasks'],
    ['ineligible', '/demo/support/ineligible'],
  ])(
    'routes the allow-listed %s answer through the configured branch',
    async (eligibility, path) => {
      const agent = request.agent(createApp());

      await agent
        .post('/demo/support/eligibility')
        .type('form')
        .send({ eligibility })
        .expect(302)
        .expect('Location', path);

      const retained = await agent.get('/demo/support/eligibility').expect(200);
      expectRadioChecked(retained.text, eligibility);
    },
  );

  test('shows the fictional ineligible outcome and a dedicated change-answer route', async () => {
    const agent = request.agent(createApp());

    await agent
      .post('/demo/support/eligibility')
      .type('form')
      .send({ eligibility: 'ineligible' })
      .expect(302)
      .expect('Location', '/demo/support/ineligible');

    const outcome = await agent.get('/demo/support/ineligible').expect(200);
    expect(outcome.text.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(outcome.text).toContain('This fictional request cannot continue');
    expect(outcome.text).toContain('It is not an eligibility decision for a real service');
    expect(outcome.text).toMatch(
      /<a\b(?=[^>]*href="\/demo\/support\/eligibility\/change")(?=[^>]*class="[^"]*\bgovuk-link\b[^"]*")[^>]*>Change the fictional eligibility answer<\/a>/,
    );

    const change = await agent.get('/demo/support/eligibility/change').expect(200);
    expectRadioChecked(change.text, 'ineligible');
    expect(change.text).toMatch(
      /<a\b(?=[^>]*href="\/demo\/support\/ineligible")(?=[^>]*class="[^"]*\bgovuk-back-link\b[^"]*")[^>]*>/,
    );
    expect(change.text).toContain('action="/demo/support/eligibility/change"');

    await agent
      .post('/demo/support/eligibility/change')
      .type('form')
      .send({ eligibility: 'eligible', returnTo: 'https://example.com' })
      .expect(302)
      .expect('Location', '/demo/support/about-you');
  });

  test('does not overwrite a retained answer after an unknown submission', async () => {
    const agent = request.agent(createApp());

    await agent
      .post('/demo/support/eligibility')
      .type('form')
      .send({ eligibility: 'ineligible' })
      .expect(302);
    const invalid = await agent
      .post('/demo/support/eligibility')
      .type('form')
      .send({ eligibility: 'unknown' })
      .expect(400);

    expect(invalid.text).not.toMatch(/<input\b(?=[^>]*value="ineligible")(?=[^>]*checked)/);
    const retained = await agent.get('/demo/support/eligibility').expect(200);
    expectRadioChecked(retained.text, 'ineligible');
  });

  test('guards the ineligible outcome and change route with the configured answer', async () => {
    const agent = request.agent(createApp());

    await agent
      .get('/demo/support/ineligible')
      .expect(302)
      .expect('Location', '/demo/support/eligibility');
    await agent
      .get('/demo/support/eligibility/change')
      .expect(302)
      .expect('Location', '/demo/support/eligibility');

    await agent
      .post('/demo/support/eligibility')
      .type('form')
      .send({ eligibility: 'eligible' })
      .expect(302);
    await agent
      .get('/demo/support/ineligible')
      .expect(302)
      .expect('Location', '/demo/support/tasks');
  });
});
