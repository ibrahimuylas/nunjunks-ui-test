const request = require('supertest');
const { createApp } = require('../../src/app/app');

async function chooseEligible(agent) {
  await agent
    .post('/demo/support/eligibility')
    .type('form')
    .send({ eligibility: 'eligible' })
    .expect(302);
}

function expectInputValue(html, name, value) {
  expect(html).toMatch(
    new RegExp(`<input\\b(?=[^>]*name="${name}")(?=[^>]*value="${value}")[^>]*>`),
  );
}

function expectOptionSelected(html, value) {
  expect(html).toMatch(new RegExp(`<option\\b(?=[^>]*value="${value}")(?=[^>]*selected)[^>]*>`));
}

describe('demo support about-you section', () => {
  test('renders the input, date input and select with useful labels, hints and back navigation', async () => {
    const agent = request.agent(createApp());
    await chooseEligible(agent);

    const response = await agent.get('/demo/support/about-you').expect(200);

    expect(response.text.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(response.text).toContain('About you');
    expect(response.text).toContain('Use fictional details only.');
    expect(response.text).toMatch(
      /<a\b(?=[^>]*href="\/demo\/support\/tasks")(?=[^>]*class="[^"]*\bgovuk-back-link\b[^"]*")[^>]*>/,
    );
    expect(response.text).toMatch(
      /<form\b(?=[^>]*method="post")(?=[^>]*action="\/demo\/support\/about-you")(?=[^>]*novalidate)[^>]*>/,
    );
    expect(response.text).toMatch(/<label\b[^>]*for="fullName"[^>]*>\s*Fictional full name/);
    expect(response.text).toContain('Do not enter a real name.');
    expect(response.text).toMatch(/<div\b[^>]*class="[^"]*\bgovuk-date-input\b/);
    expect(response.text).toContain('Use a fictional date in the past.');
    expect(response.text).toMatch(/<label\b[^>]*for="country"[^>]*>\s*Current country/);
    expect(response.text).toMatch(/<select\b[^>]*class="[^"]*\bgovuk-select\b[^>]*name="country"/);

    const tasks = await agent.get('/demo/support/tasks').expect(200);
    expect(tasks.text).toMatch(/About you[\s\S]*?In progress/);
  });

  test('renders linked summary and field errors for missing values', async () => {
    const agent = request.agent(createApp());
    await chooseEligible(agent);

    const response = await agent.post('/demo/support/about-you').type('form').send({}).expect(400);

    expect(response.text).toContain('Error: About you');
    expect(response.text).toMatch(/<div\b[^>]*class="[^"]*\bgovuk-error-summary\b/);
    expect(response.text).toMatch(
      /<a\b[^>]*href="#fullName"[^>]*>\s*Enter a fictional full name\s*<\/a>/,
    );
    expect(response.text).toMatch(
      /<a\b[^>]*href="#dateOfBirth-day"[^>]*>\s*Enter a date of birth\s*<\/a>/,
    );
    expect(response.text).toMatch(
      /<a\b[^>]*href="#country"[^>]*>\s*Select a current country\s*<\/a>/,
    );
    expect(response.text).toMatch(/id="fullName-error"[^>]*class="[^"]*\bgovuk-error-message\b/);
    expect(response.text).toMatch(/id="dateOfBirth-error"[^>]*class="[^"]*\bgovuk-error-message\b/);
    expect(response.text).toMatch(/id="country-error"[^>]*class="[^"]*\bgovuk-error-message\b/);
  });

  test('retains all browser-submitted values when one answer is invalid', async () => {
    const agent = request.agent(createApp());
    await chooseEligible(agent);

    const response = await agent
      .post('/demo/support/about-you')
      .type('form')
      .send({
        fullName: 'Alex Example',
        'dateOfBirth-day': '31',
        'dateOfBirth-month': '2',
        'dateOfBirth-year': '1990',
        country: 'scotland',
      })
      .expect(400);

    expect(response.text).toContain('Enter a real date of birth');
    expectInputValue(response.text, 'fullName', 'Alex Example');
    expectInputValue(response.text, 'dateOfBirth-day', '31');
    expectInputValue(response.text, 'dateOfBirth-month', '2');
    expectInputValue(response.text, 'dateOfBirth-year', '1990');
    expectOptionSelected(response.text, 'scotland');
  });

  test('normalizes and persists a valid section, then marks its task completed', async () => {
    const agent = request.agent(createApp());
    await chooseEligible(agent);

    await agent
      .post('/demo/support/about-you')
      .type('form')
      .send({
        fullName: '  Alex Example  ',
        'dateOfBirth-day': ' 07 ',
        'dateOfBirth-month': ' 09 ',
        'dateOfBirth-year': ' 1990 ',
        country: ' scotland ',
      })
      .expect(302)
      .expect('Location', '/demo/support/tasks');

    const retained = await agent.get('/demo/support/about-you').expect(200);
    expectInputValue(retained.text, 'fullName', 'Alex Example');
    expectInputValue(retained.text, 'dateOfBirth-day', '7');
    expectInputValue(retained.text, 'dateOfBirth-month', '9');
    expectInputValue(retained.text, 'dateOfBirth-year', '1990');
    expectOptionSelected(retained.text, 'scotland');

    const tasks = await agent.get('/demo/support/tasks').expect(200);
    expect(tasks.text).toMatch(/About you[\s\S]*?Completed/);
    expect(tasks.text).toMatch(/Support needs[\s\S]*?Not started/);
  });
});
