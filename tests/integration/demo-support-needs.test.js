const request = require('supertest');
const { createApp } = require('../../src/app/app');

async function chooseEligible(agent) {
  await agent
    .post('/demo/support/eligibility')
    .type('form')
    .send({ eligibility: 'eligible' })
    .expect(302);
}

function expectCheckboxChecked(html, value) {
  expect(html).toMatch(new RegExp(`<input\\b(?=[^>]*value="${value}")(?=[^>]*checked)[^>]*>`));
}

function expectTextareaValue(html, name, value) {
  expect(html).toMatch(
    new RegExp(`<textarea\\b(?=[^>]*name="${name}")[^>]*>${value}<\\/textarea>`),
  );
}

describe('demo support-needs section', () => {
  test('renders checkboxes, character count, optional textarea and back navigation', async () => {
    const agent = request.agent(createApp());
    await chooseEligible(agent);

    const response = await agent.get('/demo/support/support-needs').expect(200);

    expect(response.text.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(response.text).toContain('Support needs');
    expect(response.text).toContain('Use fictional information only.');
    expect(response.text).toMatch(
      /<a\b(?=[^>]*href="\/demo\/support\/tasks")(?=[^>]*class="[^"]*\bgovuk-back-link\b[^"]*")[^>]*>/,
    );
    expect(response.text).toMatch(
      /<form\b(?=[^>]*method="post")(?=[^>]*action="\/demo\/support\/support-needs")(?=[^>]*novalidate)[^>]*>/,
    );
    expect(response.text).toMatch(/<fieldset\b[^>]*class="[^"]*\bgovuk-fieldset\b/);
    expect(response.text).toMatch(/<div\b[^>]*class="[^"]*\bgovuk-checkboxes\b/);
    expect(response.text.match(/name="supportTypes" type="checkbox"/g)).toHaveLength(4);
    expect(response.text).toMatch(
      /<div\b(?=[^>]*class="[^"]*\bgovuk-character-count\b)(?=[^>]*data-maxlength="500")[^>]*>/,
    );
    expect(response.text).toMatch(
      /<textarea\b(?=[^>]*class="[^"]*\bgovuk-textarea\b)(?=[^>]*name="description")[^>]*>/,
    );
    expect(response.text).toContain('You can enter up to 500 characters');
    expect(response.text).toMatch(
      /<textarea\b(?=[^>]*class="[^"]*\bgovuk-textarea\b)(?=[^>]*name="additionalInformation")[^>]*>/,
    );
    expect(response.text).toContain('Additional information (optional)');

    const tasks = await agent.get('/demo/support/tasks').expect(200);
    expect(tasks.text).toMatch(/Support needs[\s\S]*?In progress/);
  });

  test('renders linked summary and field errors for missing required values', async () => {
    const agent = request.agent(createApp());
    await chooseEligible(agent);

    const response = await agent
      .post('/demo/support/support-needs')
      .type('form')
      .send({ additionalInformation: 'Optional fictional context' })
      .expect(400);

    expect(response.text).toContain('Error: Support needs');
    expect(response.text).toMatch(/<div\b[^>]*class="[^"]*\bgovuk-error-summary\b/);
    expect(response.text).toMatch(
      /<a\b[^>]*href="#supportTypes"[^>]*>\s*Select at least one type of fictional support\s*<\/a>/,
    );
    expect(response.text).toMatch(
      /<a\b[^>]*href="#description"[^>]*>\s*Describe the fictional support needed\s*<\/a>/,
    );
    expect(response.text).toMatch(
      /id="supportTypes-error"[^>]*class="[^"]*\bgovuk-error-message\b/,
    );
    expect(response.text).toMatch(/id="description-error"[^>]*class="[^"]*\bgovuk-error-message\b/);
    expectTextareaValue(response.text, 'additionalInformation', 'Optional fictional context');
  });

  test('rejects an unknown checkbox value without rendering it as an option', async () => {
    const agent = request.agent(createApp());
    await chooseEligible(agent);

    const response = await agent
      .post('/demo/support/support-needs')
      .type('form')
      .send({
        supportTypes: ['safe-accommodation', 'unknown'],
        description: 'A valid fictional description',
      })
      .expect(400);

    expect(response.text).toMatch(
      /<a\b[^>]*href="#supportTypes"[^>]*>\s*Select fictional support types from the list\s*<\/a>/,
    );
    expectCheckboxChecked(response.text, 'safe-accommodation');
    expect(response.text).not.toContain('value="unknown"');
    expectTextareaValue(response.text, 'description', 'A valid fictional description');
  });

  test('retains every valid field when the description exceeds 500 characters', async () => {
    const agent = request.agent(createApp());
    const description = 'x'.repeat(501);
    await chooseEligible(agent);

    const response = await agent
      .post('/demo/support/support-needs')
      .type('form')
      .send({
        supportTypes: ['safe-accommodation', 'wellbeing'],
        description,
        additionalInformation: 'Fictional follow-up details',
      })
      .expect(400);

    expect(response.text).toContain('Description must be 500 characters or fewer');
    expectCheckboxChecked(response.text, 'safe-accommodation');
    expectCheckboxChecked(response.text, 'wellbeing');
    expectTextareaValue(response.text, 'description', description);
    expectTextareaValue(response.text, 'additionalInformation', 'Fictional follow-up details');
  });

  test('normalizes and persists a valid section, then marks its task completed', async () => {
    const agent = request.agent(createApp());
    const description = 'x'.repeat(500);
    await chooseEligible(agent);

    await agent
      .post('/demo/support/support-needs')
      .type('form')
      .send({
        supportTypes: [' wellbeing ', 'safe-accommodation'],
        description: `  ${description}  `,
      })
      .expect(302)
      .expect('Location', '/demo/support/tasks');

    const retained = await agent.get('/demo/support/support-needs').expect(200);
    expectCheckboxChecked(retained.text, 'safe-accommodation');
    expectCheckboxChecked(retained.text, 'wellbeing');
    expectTextareaValue(retained.text, 'description', description);
    expectTextareaValue(retained.text, 'additionalInformation', '');

    const tasks = await agent.get('/demo/support/tasks').expect(200);
    expect(tasks.text).toMatch(/About you[\s\S]*?Not started/);
    expect(tasks.text).toMatch(/Support needs[\s\S]*?Completed/);
    expect(tasks.text).toMatch(/Evidence[\s\S]*?Not started/);
  });
});
