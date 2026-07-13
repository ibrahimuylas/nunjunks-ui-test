const request = require('supertest');
const { createApp } = require('../../src/app/app');
const journeyService = require('../../src/app/services/journey-service');

describe('demo caseworker sign-in', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders explicit fictional-authentication guidance and the password input component', async () => {
    const response = await request(createApp()).get('/demo/casework/sign-in').expect(200);

    expect(response.text.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(response.text).toContain('Sign in to the fictional casework queue');
    expect(response.text).toContain('It is not real authentication.');
    expect(response.text).toContain('Do not use a real password.');
    expect(response.text).toContain(
      'The value is discarded immediately and only a session access flag is kept.',
    );
    expect(response.text).toMatch(
      /<a\b(?=[^>]*href="\/demo")(?=[^>]*class="[^"]*\bgovuk-back-link\b[^"]*")[^>]*>/,
    );
    expect(response.text).toMatch(
      /<form\b(?=[^>]*method="post")(?=[^>]*action="\/demo\/casework\/sign-in")(?=[^>]*novalidate)[^>]*>/,
    );
    expect(response.text).toMatch(
      /<div\b(?=[^>]*class="[^"]*\bgovuk-password-input\b[^"]*")(?=[^>]*data-module="govuk-password-input")[^>]*>/,
    );
    expect(response.text).toMatch(
      /<input\b(?=[^>]*id="password")(?=[^>]*name="password")(?=[^>]*type="password")(?=[^>]*autocomplete="off")[^>]*>/,
    );
    expect(response.text).toContain('Demonstration password');
    expect(response.text).toContain('Continue');
  });

  test.each([{}, { password: '   ' }])(
    'renders linked summary and field errors without echoing submitted input for %p',
    async (form) => {
      const response = await request(createApp())
        .post('/demo/casework/sign-in')
        .type('form')
        .send(form)
        .expect(400);

      expect(response.text).toContain('Error: Sign in to the fictional casework queue');
      expect(response.text).toMatch(/<div\b[^>]*class="[^"]*\bgovuk-error-summary\b/);
      expect(response.text).toMatch(
        /<a\b[^>]*href="#password"[^>]*>\s*Enter a demonstration password\s*<\/a>/,
      );
      expect(response.text).toMatch(
        /<p\b[^>]*id="password-error"[^>]*class="[^"]*\bgovuk-error-message\b/,
      );
      expect(response.text).not.toMatch(/<input\b[^>]*name="password"[^>]*value=/);
    },
  );

  test('discards a valid demonstration value, stores only access and does not log it', async () => {
    const demonstrationValue = 'discard-me-demo-value';
    const grantAccessSpy = jest.spyOn(journeyService, 'grantDemoCaseworkAccess');
    const consoleSpies = ['log', 'warn', 'error'].map((method) =>
      jest.spyOn(console, method).mockImplementation(() => {}),
    );

    await request(createApp())
      .post('/demo/casework/sign-in')
      .type('form')
      .send({ password: `  ${demonstrationValue}  ` })
      .expect(302)
      .expect('Location', '/demo/casework/queue');

    expect(grantAccessSpy).toHaveBeenCalledTimes(1);
    const [session] = grantAccessSpy.mock.calls[0];
    expect(journeyService.getDemoCaseworkState(session)).toEqual({
      values: {},
      completion: { signedIn: true },
    });
    expect(JSON.stringify(session)).not.toContain(demonstrationValue);
    expect(
      JSON.stringify(consoleSpies.flatMap((spy) => spy.mock.calls)),
    ).not.toContain(demonstrationValue);
  });

  test('redirects protected casework routes until access has been granted', async () => {
    const app = createApp();

    await request(app)
      .get('/demo/casework/queue')
      .expect(302)
      .expect('Location', '/demo/casework/sign-in');
    await request(app)
      .get('/demo/casework/requests/DEMO-CW-1001')
      .expect(302)
      .expect('Location', '/demo/casework/sign-in');
    await request(app)
      .post('/demo/casework/requests/DEMO-CW-1001/decision')
      .type('form')
      .send({ decision: 'priority' })
      .expect(302)
      .expect('Location', '/demo/casework/sign-in');
  });

  test('recognizes the session access flag on later requests', async () => {
    const agent = request.agent(createApp());

    await agent
      .post('/demo/casework/sign-in')
      .type('form')
      .send({ password: 'made-up' })
      .expect(302)
      .expect('Location', '/demo/casework/queue');
    await agent
      .get('/demo/casework/sign-in')
      .expect(302)
      .expect('Location', '/demo/casework/queue');
  });
});
