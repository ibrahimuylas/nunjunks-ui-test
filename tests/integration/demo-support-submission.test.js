const request = require('supertest');
const { createApp } = require('../../src/app/app');

const confirmationPath = '/demo/support/confirmation';

async function chooseEligible(agent) {
  await agent
    .post('/demo/support/eligibility')
    .type('form')
    .send({ eligibility: 'eligible' })
    .expect(302);
}

async function completeRequiredSections(agent) {
  await chooseEligible(agent);
  await agent
    .post('/demo/support/about-you')
    .type('form')
    .send({
      fullName: 'Alex Example',
      'dateOfBirth-day': '7',
      'dateOfBirth-month': '9',
      'dateOfBirth-year': '1990',
      country: 'scotland',
    })
    .expect(302);
  await agent
    .post('/demo/support/support-needs')
    .type('form')
    .send({
      supportTypes: 'safe-accommodation',
      description: 'A fictional support description',
      additionalInformation: '',
    })
    .expect(302);
  await agent
    .post('/demo/support/evidence')
    .set('Content-Type', 'multipart/form-data; boundary=empty-evidence')
    .send('--empty-evidence--\r\n')
    .expect(302);
}

function extractReference(response) {
  return response.text.match(/DEMO-[A-F0-9]{8}/)?.[0];
}

describe('demo support submission and confirmation', () => {
  test('guards confirmation until all required answers are submitted', async () => {
    const agent = request.agent(createApp());

    await agent.get(confirmationPath).expect(302).expect('Location', '/demo/support/eligibility');

    await chooseEligible(agent);
    await agent.get(confirmationPath).expect(302).expect('Location', '/demo/support/about-you');

    await agent
      .post('/demo/support/about-you')
      .type('form')
      .send({
        fullName: 'Alex Example',
        'dateOfBirth-day': '7',
        'dateOfBirth-month': '9',
        'dateOfBirth-year': '1990',
        country: 'scotland',
      })
      .expect(302);
    await agent.get(confirmationPath).expect(302).expect('Location', '/demo/support/support-needs');
  });

  test('uses POST-redirect-GET and keeps one reference across refresh and replay', async () => {
    const agent = request.agent(createApp());
    await completeRequiredSections(agent);

    await agent.get(confirmationPath).expect(302).expect('Location', '/demo/support/check-answers');
    await agent
      .post('/demo/support/check-answers')
      .expect(302)
      .expect('Location', confirmationPath);

    const confirmation = await agent.get(confirmationPath).expect(200);
    const reference = extractReference(confirmation);

    expect(reference).toMatch(/^DEMO-[A-F0-9]{8}$/);
    expect(confirmation.text.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(confirmation.text).toMatch(/class="govuk-panel(?: |")/);
    expect(confirmation.text).toContain('Fictional request submitted');
    expect(confirmation.text).toContain('What happens next');
    expect(confirmation.text).toContain('has not sent the request');
    expect(confirmation.text).toContain('href="/demo"');
    expect(confirmation.text).toContain('Return to demo home');

    expect(extractReference(await agent.get(confirmationPath).expect(200))).toBe(reference);
    await agent
      .post('/demo/support/check-answers')
      .expect(302)
      .expect('Location', confirmationPath);
    expect(extractReference(await agent.get(confirmationPath).expect(200))).toBe(reference);

    const tasks = await agent.get('/demo/support/tasks').expect(200);
    expect(tasks.text).toMatch(/Check your answers[\s\S]*?Completed/);
  });

  test('invalidates confirmation after an edit and reset', async () => {
    const agent = request.agent(createApp());
    await completeRequiredSections(agent);
    await agent.post('/demo/support/check-answers').expect(302);
    const firstReference = extractReference(await agent.get(confirmationPath).expect(200));

    await agent
      .post('/demo/support/about-you/change')
      .type('form')
      .send({
        fullName: 'Jordan Example',
        'dateOfBirth-day': '8',
        'dateOfBirth-month': '10',
        'dateOfBirth-year': '1991',
        country: 'wales',
      })
      .expect(302)
      .expect('Location', '/demo/support/check-answers');
    await agent.get(confirmationPath).expect(302).expect('Location', '/demo/support/check-answers');

    const changedAnswers = await agent.get('/demo/support/check-answers').expect(200);
    expect(changedAnswers.text).toContain('Jordan Example');
    const tasks = await agent.get('/demo/support/tasks').expect(200);
    expect(tasks.text).toMatch(/Check your answers[\s\S]*?In progress/);

    await agent.post('/demo/support/check-answers').expect(302);
    const secondReference = extractReference(await agent.get(confirmationPath).expect(200));
    expect(secondReference).toMatch(/^DEMO-[A-F0-9]{8}$/);
    expect(secondReference).not.toBe(firstReference);

    await agent.post('/demo/support/reset').expect(302).expect('Location', '/demo');
    await agent.get(confirmationPath).expect(302).expect('Location', '/demo/support/eligibility');
  });
});
