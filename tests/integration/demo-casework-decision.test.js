const request = require('supertest');
const { createApp } = require('../../src/app/app');

async function signedInAgent() {
  const agent = request.agent(createApp());

  await agent
    .post('/demo/casework/sign-in')
    .type('form')
    .send({ password: 'fictional-value' })
    .expect(302)
    .expect('Location', '/demo/casework/queue');

  return agent;
}

describe('demo casework decision flow', () => {
  const formPath = '/demo/casework/requests/DEMO-CW-1001/decision?tab=unassigned&page=1';
  const outcomePath = '/demo/casework/requests/DEMO-CW-1001/decision/outcome?tab=unassigned&page=1';

  test('renders the linear form with its back link, components and fictional warning', async () => {
    const agent = await signedInAgent();
    const response = await agent.get(formPath).expect(200);

    expect(response.text.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(response.text).toContain('Record a decision for DEMO-CW-1001');
    expect(response.text).toContain('Demo household Aster');
    expect(response.text).toMatch(
      /<a\b(?=[^>]*href="\/demo\/casework\/requests\/DEMO-CW-1001\?tab=unassigned&amp;page=1")(?=[^>]*class="[^"]*\bgovuk-back-link\b)[^>]*>/,
    );
    expect(response.text).toMatch(
      /<form\b(?=[^>]*method="post")(?=[^>]*action="\/demo\/casework\/requests\/DEMO-CW-1001\/decision\?tab=unassigned&amp;page=1")(?=[^>]*novalidate)[^>]*>/,
    );
    expect(response.text).toMatch(/class="govuk-radios(?: |")/);
    expect(response.text).toMatch(/<fieldset\b[^>]*class="[^"]*\bgovuk-fieldset\b/);
    expect(response.text).toMatch(/<textarea\b[^>]*name="caseNote"/);
    expect(response.text).toMatch(/class="govuk-warning-text(?: |")/);
    expect(response.text).toContain(
      'Saving will move this fictional request to Completed for the rest of your demo session.',
    );
  });

  test('shows a linked missing-decision error while retaining and escaping the note', async () => {
    const agent = await signedInAgent();
    const response = await agent
      .post(formPath)
      .type('form')
      .send({ decision: '', caseNote: '  Retain <fictional> & note  ' })
      .expect(400);

    expect(response.text).toContain('Error: Record a decision for DEMO-CW-1001');
    expect(response.text).toMatch(/class="[^"]*\bgovuk-error-summary\b/);
    expect(response.text).toMatch(
      /<a\b[^>]*href="#decision"[^>]*>\s*Select a demonstration decision\s*<\/a>/,
    );
    expect(response.text).toMatch(
      /<p\b[^>]*id="decision-error"[^>]*class="[^"]*\bgovuk-error-message\b/,
    );
    expect(response.text).toContain('Retain &lt;fictional&gt; &amp; note');
    expect(response.text).not.toContain('<fictional>');
  });

  test('uses POST-redirect-GET for a stable, replay-safe saved outcome', async () => {
    const agent = await signedInAgent();
    const decision = {
      decision: 'priority',
      caseNote: 'A fictional priority note.',
    };

    await agent
      .post(formPath)
      .type('form')
      .send(decision)
      .expect(302)
      .expect('Location', outcomePath);

    const firstOutcome = await agent.get(outcomePath).expect(200);

    expect(firstOutcome.text.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(firstOutcome.text).toMatch(
      /class="[^"]*\bgovuk-notification-banner--success\b[^"]*"[^>]*role="alert"/,
    );
    expect(firstOutcome.text).toContain('Request DEMO-CW-1001 was recorded as Priority.');
    expect(firstOutcome.text).toContain('href="/demo/casework/queue?tab=unassigned&amp;page=1"');

    const refreshedOutcome = await agent.get(outcomePath).expect(200);
    expect(refreshedOutcome.text).toContain('Request DEMO-CW-1001 was recorded as Priority.');

    await agent
      .post(formPath)
      .type('form')
      .send(decision)
      .expect(302)
      .expect('Location', outcomePath);

    const queue = await agent.get('/demo/casework/queue?tab=unassigned&page=1').expect(200);
    expect(queue.text).toMatch(
      /DEMO-CW-1001[\s\S]*?<strong\b[^>]*class="[^"]*\bgovuk-tag--red\b[^"]*"[^>]*>\s*Priority\s*<\/strong>/,
    );
  });

  test('guards the outcome until this session has saved a decision', async () => {
    const agent = await signedInAgent();

    await agent.get(outcomePath).expect(404);
  });

  test('protects every decision route behind fictional casework access', async () => {
    const app = createApp();

    await request(app).get(formPath).expect(302).expect('Location', '/demo/casework/sign-in');
    await request(app)
      .post(formPath)
      .type('form')
      .send({ decision: 'standard' })
      .expect(302)
      .expect('Location', '/demo/casework/sign-in');
    await request(app).get(outcomePath).expect(302).expect('Location', '/demo/casework/sign-in');
  });

  test('canonicalizes form and outcome context and rejects unknown requests', async () => {
    const agent = await signedInAgent();

    await agent
      .get('/demo/casework/requests/DEMO-CW-1001/decision')
      .query({ tab: 'unknown', page: '0', returnUrl: 'https://example.invalid' })
      .expect(302)
      .expect('Location', formPath);

    await agent
      .get('/demo/casework/requests/DEMO-CW-9999/decision?tab=unassigned&page=1')
      .expect(404);
    await agent
      .post('/demo/casework/requests/DEMO-CW-9999/decision?tab=unassigned&page=1')
      .type('form')
      .send({ decision: 'standard' })
      .expect(404);

    await agent
      .post(formPath)
      .type('form')
      .send({ decision: 'standard' })
      .expect(302)
      .expect('Location', outcomePath);
    await agent
      .get('/demo/casework/requests/DEMO-CW-1001/decision/outcome')
      .query({ tab: 'completed', page: '99', returnUrl: 'https://example.invalid' })
      .expect(302)
      .expect('Location', outcomePath);
  });
});
