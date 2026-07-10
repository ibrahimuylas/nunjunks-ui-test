const request = require('supertest');
const { createApp } = require('../../src/app/app');

const sessionCookieName = 'govuk-defra-example.sid';

function expectOnlyEssentialSessionCookie(response) {
  const setCookieHeaders = response.headers['set-cookie'] || [];

  expect(setCookieHeaders).toHaveLength(1);
  expect(setCookieHeaders[0]).toMatch(new RegExp(`^${sessionCookieName}=`));
  expect(setCookieHeaders[0]).toContain('HttpOnly');
  expect(setCookieHeaders[0]).toContain('SameSite=Lax');
  expect(setCookieHeaders[0]).not.toMatch(/(?:^|;\s*)(?:Max-Age|Expires)=/i);
}

describe('demo cookie banner', () => {
  test('renders the first-visit banner without setting a cookie', async () => {
    const response = await request(createApp()).get('/demo');

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.text).toMatch(
      /<form\b(?=[^>]*method="post")(?=[^>]*action="\/demo\/cookies")[^>]*>/,
    );
    expect(response.text).toMatch(
      /<input\b(?=[^>]*type="hidden")(?=[^>]*name="returnTo")(?=[^>]*value="\/demo")[^>]*>/,
    );
    expect(response.text).toMatch(
      /<div\b(?=[^>]*class="[^"]*\bgovuk-cookie-banner\b[^"]*")(?=[^>]*role="region")[^>]*>/,
    );
    expect(response.text).toContain('Cookies on this component demo');
    expect(response.text).toContain('We only use an essential session cookie.');
    expect(response.text).toMatch(
      /<button\b(?=[^>]*name="cookies")(?=[^>]*value="accept")(?=[^>]*type="submit")[^>]*>/,
    );
    expect(response.text).toMatch(
      /<button\b(?=[^>]*name="cookies")(?=[^>]*value="reject")(?=[^>]*type="submit")[^>]*>/,
    );
  });

  test('carries the current demo URL into the cookie form', async () => {
    const response = await request(createApp()).get('/demo?source=cookie-banner');

    expect(response.status).toBe(200);
    expect(response.text).toMatch(
      /<input\b(?=[^>]*name="returnTo")(?=[^>]*value="\/demo\?source=cookie-banner")[^>]*>/,
    );
  });

  test.each([
    ['accept', 'accepted'],
    ['reject', 'rejected'],
  ])(
    'renders the %s acknowledgement and sets only the essential session cookie',
    async (action, state) => {
      const agent = request.agent(createApp());

      const choiceResponse = await agent
        .post('/demo/cookies')
        .type('form')
        .send({ cookies: action })
        .expect(302)
        .expect('Location', '/demo');

      expectOnlyEssentialSessionCookie(choiceResponse);

      const acknowledgement = await agent.get('/demo').expect(200);

      expect(acknowledgement.headers['set-cookie']).toBeUndefined();
      expect(acknowledgement.text).toMatch(
        /<div\b(?=[^>]*class="[^"]*\bgovuk-cookie-banner__message\b[^"]*")(?=[^>]*role="alert")[^>]*>/,
      );
      expect(acknowledgement.text).toContain(`You ${state} optional cookies`);
      expect(acknowledgement.text).toContain('No optional cookies were set.');
      expect(acknowledgement.text).toContain('Hide cookie message');
      expect(acknowledgement.text).not.toContain('Accept optional cookies');
      expect(acknowledgement.text).not.toContain('Reject optional cookies');
    },
  );

  test('hides an acknowledgement through a server-rendered POST action', async () => {
    const agent = request.agent(createApp());

    await agent.post('/demo/cookies').type('form').send({ cookies: 'accept' }).expect(302);
    const hideResponse = await agent
      .post('/demo/cookies')
      .type('form')
      .send({ cookies: 'hide' })
      .expect(302)
      .expect('Location', '/demo');

    expect(hideResponse.headers['set-cookie']).toBeUndefined();

    const response = await agent.get('/demo').expect(200);

    expect(response.text).not.toContain('govuk-cookie-banner');
  });

  test.each(['track-everything', 'constructor', '__proto__'])(
    'ignores the unknown %s action without creating session state',
    async (action) => {
      const agent = request.agent(createApp());

      const actionResponse = await agent
        .post('/demo/cookies')
        .type('form')
        .send({ cookies: action })
        .expect(302)
        .expect('Location', '/demo');

      expect(actionResponse.headers['set-cookie']).toBeUndefined();

      const response = await agent.get('/demo').expect(200);
      expect(response.text).toContain('Accept optional cookies');
      expect(response.text).toContain('Reject optional cookies');
    },
  );

  test('returns to a validated demo path with its query after a choice', async () => {
    const returnTo = '/demo/support/start?source=cookie-banner';

    const response = await request(createApp())
      .post('/demo/cookies')
      .type('form')
      .send({ cookies: 'accept', returnTo })
      .expect(302)
      .expect('Location', returnTo);

    expectOnlyEssentialSessionCookie(response);
  });

  test.each([
    'https://example.com/demo',
    'http://demo.local/demo',
    '//example.com/demo',
    '/demo/../admin',
    '/demo\\example.com',
    '/demo\r\nLocation: https://example.com',
  ])('falls back to demo home for the unsafe return path %j', async (returnTo) => {
    await request(createApp())
      .post('/demo/cookies')
      .type('form')
      .send({ cookies: 'reject', returnTo })
      .expect(302)
      .expect('Location', '/demo');
  });

  test.each([
    ['accept', 'accepted', '/demo/support/reset'],
    ['accept', 'accepted', '/demo/casework/reset'],
    ['reject', 'rejected', '/demo/support/reset'],
    ['reject', 'rejected', '/demo/casework/reset'],
  ])('preserves the %s (%s) choice across %s', async (action, state, resetPath) => {
    const agent = request.agent(createApp());

    await agent.post('/demo/cookies').type('form').send({ cookies: action }).expect(302);
    await agent.post(resetPath).expect(302).expect('Location', '/demo');

    const response = await agent.get('/demo').expect(200);

    expect(response.text).toContain(`You ${state} optional cookies`);
    expect(response.text).not.toContain('Accept optional cookies');
    expect(response.text).not.toContain('Reject optional cookies');
  });
});
