const request = require('supertest');
const { createApp } = require('../../src/app/app');

describe('demo home', () => {
  test('renders a clearly fictional landing page with both scenario entry links', async () => {
    const response = await request(createApp()).get('/demo');

    expect(response.status).toBe(200);
    expect(response.text.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(response.text).toContain('This service is fictional.');
    expect(response.text).toContain('Do not enter real personal information or passwords.');
    expect(response.text).toContain('href="/demo/support/start"');
    expect(response.text).toContain('Explore the public journey');
    expect(response.text).toContain('href="/demo/casework/sign-in"');
    expect(response.text).toContain('Explore the caseworker journey');
  });

  test('renders separate POST reset actions for both scenarios', async () => {
    const response = await request(createApp()).get('/demo');

    expect(response.status).toBe(200);
    expect(response.text).toMatch(
      /<form\b(?=[^>]*method="post")(?=[^>]*action="\/demo\/support\/reset")[^>]*>/,
    );
    expect(response.text).toContain('Reset public journey');
    expect(response.text).toMatch(
      /<form\b(?=[^>]*method="post")(?=[^>]*action="\/demo\/casework\/reset")[^>]*>/,
    );
    expect(response.text).toContain('Reset caseworker journey');
  });

  test.each(['/demo/support/reset', '/demo/casework/reset'])(
    '%s is POST-only and redirects safely to demo home',
    async (resetPath) => {
      const app = createApp();

      await request(app).get(resetPath).expect(404);
      await request(app)
        .post(resetPath)
        .type('form')
        .send({ returnUrl: 'https://example.com' })
        .expect(302)
        .expect('Location', '/demo');
    },
  );

  test('renders the shared shell and navigation back to demo home', async () => {
    const response = await request(createApp()).get('/demo');

    expect(response.status).toBe(200);
    expect(response.text).toMatch(
      /<a\b(?=[^>]*href="#main-content")(?=[^>]*class="[^"]*\bgovuk-skip-link\b[^"]*")[^>]*>/,
    );
    expect(response.text).toMatch(
      /<header\b(?=[^>]*class="[^"]*\bgovuk-header\b[^"]*")[^>]*>/,
    );
    expect(response.text).toMatch(
      /<a\b(?=[^>]*href="\/demo")(?=[^>]*class="[^"]*\bgovuk-header__link--homepage\b[^"]*")[^>]*>/,
    );
    expect(response.text).toMatch(
      /<section\b(?=[^>]*class="[^"]*\bgovuk-service-navigation\b[^"]*")[^>]*>/,
    );
    expect(response.text).toContain('Fictional support service');
    expect(response.text).toContain('Demo home');
    expect(response.text).toContain('Public journey');
    expect(response.text).toContain('Caseworker journey');
    expect(response.text).toContain('aria-current="page"');
    expect(response.text).toMatch(
      /<div\b(?=[^>]*class="[^"]*\bgovuk-phase-banner\b[^"]*")[^>]*>/,
    );
    expect(response.text).toContain('Prototype');
    expect(response.text).toMatch(
      /<main\b(?=[^>]*id="main-content")(?=[^>]*role="main")[^>]*>/,
    );
    expect(response.text).toMatch(
      /<footer\b(?=[^>]*class="[^"]*\bgovuk-footer\b[^"]*")[^>]*>/,
    );
  });

  test('preserves the legacy journey entry points', async () => {
    await request(createApp()).get('/').expect(302).expect('Location', '/start');

    const response = await request(createApp()).get('/start');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Apply for a farming update');
  });
});
