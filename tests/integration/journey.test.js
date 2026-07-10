const request = require('supertest');
const { createApp } = require('../../src/app/app');

describe('journey routes', () => {
  test('start page renders a start button', async () => {
    const response = await request(createApp()).get('/start');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Start now');
    expect(response.text).toContain('/business-type');
  });

  test('pages use the supported GOV.UK Frontend module bootstrap', async () => {
    const response = await request(createApp()).get('/start');

    expect(response.status).toBe(200);
    expect(response.text).toContain(
      "<script>document.body.className += ' js-enabled' + ('noModule' in HTMLScriptElement.prototype ? ' govuk-frontend-supported' : '');</script>",
    );
    expect(response.text).toContain(
      '<script type="module" src="/public/javascripts/application.js"></script>',
    );
    expect(response.text).not.toContain(
      '<script src="/public/javascripts/govuk-frontend.min.js"></script>',
    );
  });

  test('application module imports and initialises GOV.UK Frontend', async () => {
    const response = await request(createApp()).get('/public/javascripts/application.js');

    expect(response.status).toBe(200);
    expect(response.text).toContain("import { initAll } from './govuk-frontend.min.js';");
    expect(response.text).toContain('initAll();');
    expect(response.text).toContain('[data-module="app-name-preview"]');
    expect(response.text).toContain('[data-app-name-preview-output]');
  });

  test('business type validation error is rendered', async () => {
    const response = await request(createApp()).post('/business-type').type('form').send({});

    expect(response.status).toBe(400);
    expect(response.text).toContain('There is a problem');
    expect(response.text).toContain('Select whether you have a farming business');
  });

  test('business type yes routes to business details', async () => {
    const agent = request.agent(createApp());

    await agent
      .post('/business-type')
      .type('form')
      .send({ hasFarmingBusiness: 'yes' })
      .expect(302)
      .expect('Location', '/business-details');

    const response = await agent.get('/business-details').expect(200);
    expect(response.text).toContain('What is the business name?');
  });

  test('business type no routes to personal details', async () => {
    const agent = request.agent(createApp());

    await agent
      .post('/business-type')
      .type('form')
      .send({ hasFarmingBusiness: 'no' })
      .expect(302)
      .expect('Location', '/full-name');

    const response = await agent.get('/full-name').expect(200);
    expect(response.text).toContain('What is your full name?');
  });

  test('full name validation error renders an error summary and field error', async () => {
    const agent = request.agent(createApp());

    await agent.post('/business-type').type('form').send({ hasFarmingBusiness: 'no' }).expect(302);

    const response = await agent.post('/full-name').type('form').send({
      fullName: '',
      'dateOfBirth-day': '7',
      'dateOfBirth-month': '9',
      'dateOfBirth-year': '1990',
    });

    expect(response.status).toBe(400);
    expect(response.text).toContain('There is a problem');
    expect(response.text).toContain('Enter your full name');
    expect(response.text).toContain('govuk-error-summary');
  });

  test('date of birth validation error renders an error summary and field error', async () => {
    const agent = request.agent(createApp());

    await agent.post('/business-type').type('form').send({ hasFarmingBusiness: 'no' }).expect(302);

    const response = await agent.post('/full-name').type('form').send({
      fullName: 'Jane Doe',
      'dateOfBirth-day': '31',
      'dateOfBirth-month': '2',
      'dateOfBirth-year': '1990',
    });

    expect(response.status).toBe(400);
    expect(response.text).toContain('There is a problem');
    expect(response.text).toContain('Enter a real date of birth');
    expect(response.text).toContain('govuk-error-summary');
  });

  test('later pages require previous answers', async () => {
    const response = await request(createApp()).get('/updates');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/business-type');
  });

  test('updates page is available after individual branch details are complete', async () => {
    const agent = request.agent(createApp());

    await agent.post('/business-type').type('form').send({ hasFarmingBusiness: 'no' }).expect(302);
    await agent
      .post('/full-name')
      .type('form')
      .send({
        fullName: 'Jane Doe',
        'dateOfBirth-day': '7',
        'dateOfBirth-month': '9',
        'dateOfBirth-year': '1990',
      })
      .expect(302);

    const response = await agent.get('/updates').expect(200);
    expect(response.text).toContain('Do you want to receive updates?');
  });

  test('successful individual branch flow reaches confirmation', async () => {
    const agent = request.agent(createApp());

    await agent.post('/business-type').type('form').send({ hasFarmingBusiness: 'no' }).expect(302);
    await agent
      .post('/full-name')
      .type('form')
      .send({
        fullName: 'Jane Doe',
        'dateOfBirth-day': '7',
        'dateOfBirth-month': '9',
        'dateOfBirth-year': '1990',
      })
      .expect(302);
    await agent.post('/updates').type('form').send({ receiveUpdates: 'yes' }).expect(302);

    const checkAnswers = await agent.get('/check-answers').expect(200);
    expect(checkAnswers.text).toContain('Do you have a farming business?');
    expect(checkAnswers.text).toContain('No');
    expect(checkAnswers.text).toContain('Jane Doe');
    expect(checkAnswers.text).toContain('7 9 1990');
    expect(checkAnswers.text).toContain('Yes');

    await agent.post('/check-answers').expect(302).expect('Location', '/confirmation');

    const confirmation = await agent.get('/confirmation').expect(200);
    expect(confirmation.text).toContain('Application complete');
    expect(confirmation.text).toContain('HDJ2123F');
  });

  test('successful business branch flow reaches confirmation', async () => {
    const agent = request.agent(createApp());

    await agent
      .post('/business-type')
      .type('form')
      .send({ hasFarmingBusiness: 'yes' })
      .expect(302)
      .expect('Location', '/business-details');
    await agent
      .post('/business-details')
      .type('form')
      .send({ businessName: 'Green Valley Farm' })
      .expect(302)
      .expect('Location', '/updates');
    await agent.post('/updates').type('form').send({ receiveUpdates: 'no' }).expect(302);

    const checkAnswers = await agent.get('/check-answers').expect(200);
    expect(checkAnswers.text).toContain('Do you have a farming business?');
    expect(checkAnswers.text).toContain('Yes');
    expect(checkAnswers.text).toContain('Green Valley Farm');
    expect(checkAnswers.text).not.toContain('Date of birth');
    expect(checkAnswers.text).toContain('No');

    await agent.post('/check-answers').expect(302).expect('Location', '/confirmation');

    const confirmation = await agent.get('/confirmation').expect(200);
    expect(confirmation.text).toContain('Application complete');
  });

  test('updates validation error is rendered', async () => {
    const agent = request.agent(createApp());

    await agent.post('/business-type').type('form').send({ hasFarmingBusiness: 'no' }).expect(302);
    await agent
      .post('/full-name')
      .type('form')
      .send({
        fullName: 'Jane Doe',
        'dateOfBirth-day': '7',
        'dateOfBirth-month': '9',
        'dateOfBirth-year': '1990',
      })
      .expect(302);
    const response = await agent.post('/updates').type('form').send({}).expect(400);

    expect(response.text).toContain('Select whether you want to receive updates');
    expect(response.text).toContain('govuk-error-summary');
  });
});
