const { Buffer } = require('node:buffer');
const request = require('supertest');
const { createApp } = require('../../src/app/app');

const checkAnswersPath = '/demo/support/check-answers';

async function chooseEligible(agent) {
  await agent
    .post('/demo/support/eligibility')
    .type('form')
    .send({ eligibility: 'eligible' })
    .expect(302);
}

async function completeAboutYou(agent, fullName = 'Alex Example') {
  await agent
    .post('/demo/support/about-you')
    .type('form')
    .send({
      fullName,
      'dateOfBirth-day': '7',
      'dateOfBirth-month': '9',
      'dateOfBirth-year': '1990',
      country: 'scotland',
    })
    .expect(302);
}

async function completeSupportNeeds(agent, description = 'Original fictional support description') {
  await agent
    .post('/demo/support/support-needs')
    .type('form')
    .send({
      supportTypes: ['safe-accommodation', 'wellbeing'],
      description,
      additionalInformation: 'Original fictional additional information',
    })
    .expect(302);
}

async function completeEvidence(agent, filename = 'original-fictional-evidence.pdf') {
  await agent
    .post('/demo/support/evidence')
    .attach('evidence', Buffer.from('discarded fictional evidence'), {
      filename,
      contentType: 'application/pdf',
    })
    .expect(302);
}

async function completedAgent() {
  const agent = request.agent(createApp());

  await chooseEligible(agent);
  await completeAboutYou(agent);
  await completeSupportNeeds(agent);
  await completeEvidence(agent);

  return agent;
}

function expectFixedChangeForm(response, path) {
  expect(response.text).toMatch(
    new RegExp(
      `<a\\b(?=[^>]*href="${checkAnswersPath}")(?=[^>]*class="[^"]*\\bgovuk-back-link\\b[^"]*")[^>]*>`,
    ),
  );
  expect(response.text).toMatch(
    new RegExp(`<form\\b(?=[^>]*method="post")(?=[^>]*action="${path}")[^>]*>`),
  );
}

describe('demo support change-answer behavior', () => {
  test('renders every check-answer action as an allow-listed change route', async () => {
    const agent = await completedAgent();
    const checkAnswers = await agent.get(checkAnswersPath).expect(200);
    const hrefs = [...checkAnswers.text.matchAll(/href="(\/demo\/support\/[^"?]+\/change)"/g)].map(
      (match) => match[1],
    );

    expect(hrefs).toEqual([
      '/demo/support/eligibility/change',
      '/demo/support/about-you/change',
      '/demo/support/about-you/change',
      '/demo/support/about-you/change',
      '/demo/support/support-needs/change',
      '/demo/support/support-needs/change',
      '/demo/support/support-needs/change',
      '/demo/support/evidence/change',
    ]);

    for (const path of new Set(hrefs)) {
      const response = await agent.get(`${path}?returnTo=https%3A%2F%2Fexample.com`).expect(200);
      expectFixedChangeForm(response, path);
    }
  });

  test('returns an unchanged eligibility answer directly to check answers', async () => {
    const agent = await completedAgent();

    await agent
      .post('/demo/support/eligibility/change?returnTo=https%3A%2F%2Fexample.com')
      .type('form')
      .send({ eligibility: 'eligible', returnTo: 'https://example.com' })
      .expect(302)
      .expect('Location', checkAnswersPath);

    const checkAnswers = await agent.get(checkAnswersPath).expect(200);
    expect(checkAnswers.text).toContain('Alex Example');
    expect(checkAnswers.text).toContain('Original fictional support description');
    expect(checkAnswers.text).toContain('original-fictional-evidence.pdf');
  });

  test('changes about-you answers and retains every other completed section', async () => {
    const agent = await completedAgent();
    const change = await agent.get('/demo/support/about-you/change').expect(200);

    expectFixedChangeForm(change, '/demo/support/about-you/change');
    expect(change.text).toContain('value="Alex Example"');

    await agent
      .post('/demo/support/about-you/change?returnTo=//example.com')
      .type('form')
      .send({
        fullName: 'Jordan Example',
        'dateOfBirth-day': '8',
        'dateOfBirth-month': '10',
        'dateOfBirth-year': '1991',
        country: 'wales',
        returnTo: 'https://example.com',
      })
      .expect(302)
      .expect('Location', checkAnswersPath);

    const checkAnswers = await agent.get(checkAnswersPath).expect(200);
    expect(checkAnswers.text).toContain('Jordan Example');
    expect(checkAnswers.text).toContain('8 October 1991');
    expect(checkAnswers.text).toContain('Wales');
    expect(checkAnswers.text).toContain('Original fictional support description');
    expect(checkAnswers.text).toContain('original-fictional-evidence.pdf');
  });

  test('keeps support-needs validation in change mode and returns a valid edit to check answers', async () => {
    const agent = await completedAgent();
    const invalid = await agent
      .post('/demo/support/support-needs/change?returnTo=https%3A%2F%2Fexample.com')
      .type('form')
      .send({ returnTo: 'https://example.com' })
      .expect(400);

    expectFixedChangeForm(invalid, '/demo/support/support-needs/change');

    await agent
      .post('/demo/support/support-needs/change?returnTo=https%3A%2F%2Fexample.com')
      .type('form')
      .send({
        supportTypes: 'personal-safety',
        description: 'Updated fictional support description',
        additionalInformation: '',
        returnTo: 'https://example.com',
      })
      .expect(302)
      .expect('Location', checkAnswersPath);

    const checkAnswers = await agent.get(checkAnswersPath).expect(200);
    expect(checkAnswers.text).toContain('Alex Example');
    expect(checkAnswers.text).toContain('Help to stay safe');
    expect(checkAnswers.text).toContain('Updated fictional support description');
    expect(checkAnswers.text).toContain('original-fictional-evidence.pdf');
  });

  test('changes evidence metadata and retains the other completed answers', async () => {
    const agent = await completedAgent();
    const change = await agent.get('/demo/support/evidence/change').expect(200);

    expectFixedChangeForm(change, '/demo/support/evidence/change');
    expect(change.text).toContain('original-fictional-evidence.pdf');

    await agent
      .post('/demo/support/evidence/change?returnTo=https%3A%2F%2Fexample.com')
      .attach('evidence', Buffer.from('replacement contents are discarded'), {
        filename: 'replacement-fictional-evidence.png',
        contentType: 'image/png',
      })
      .expect(302)
      .expect('Location', checkAnswersPath);

    const checkAnswers = await agent.get(checkAnswersPath).expect(200);
    expect(checkAnswers.text).toContain('Alex Example');
    expect(checkAnswers.text).toContain('Original fictional support description');
    expect(checkAnswers.text).toContain('replacement-fictional-evidence.png');
    expect(checkAnswers.text).not.toContain('original-fictional-evidence.pdf');
  });

  test('clears stale section answers across both eligibility branch changes', async () => {
    const agent = await completedAgent();

    await agent
      .post('/demo/support/eligibility/change')
      .type('form')
      .send({ eligibility: 'ineligible', returnTo: 'https://example.com' })
      .expect(302)
      .expect('Location', '/demo/support/ineligible');
    await agent.get(checkAnswersPath).expect(302).expect('Location', '/demo/support/ineligible');

    const ineligibleChange = await agent.get('/demo/support/eligibility/change').expect(200);
    expect(ineligibleChange.text).toMatch(
      /<a\b(?=[^>]*href="\/demo\/support\/ineligible")(?=[^>]*class="[^"]*\bgovuk-back-link\b[^"]*")[^>]*>/,
    );

    await agent
      .post('/demo/support/eligibility/change?returnTo=//example.com')
      .type('form')
      .send({ eligibility: 'eligible', returnTo: '//example.com' })
      .expect(302)
      .expect('Location', '/demo/support/about-you');

    const tasks = await agent.get('/demo/support/tasks').expect(200);
    expect(tasks.text.match(/>\s*Not started\s*<\/strong>/g)).toHaveLength(3);
    expect(tasks.text).toContain('Cannot start yet');

    const aboutYou = await agent.get('/demo/support/about-you').expect(200);
    expect(aboutYou.text).not.toContain('value="Alex Example"');
    await agent.get(checkAnswersPath).expect(302).expect('Location', '/demo/support/about-you');
  });

  test('guards section change routes until check answers is available', async () => {
    const agent = request.agent(createApp());

    await agent
      .get('/demo/support/eligibility/change')
      .expect(302)
      .expect('Location', '/demo/support/eligibility');

    await chooseEligible(agent);

    for (const path of [
      '/demo/support/about-you/change',
      '/demo/support/support-needs/change',
      '/demo/support/evidence/change',
    ]) {
      await agent.get(path).expect(302).expect('Location', '/demo/support/about-you');
    }
  });
});
