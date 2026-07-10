const request = require('supertest');
const { createApp } = require('../../src/app/app');

const safeExitUrl = 'https://www.bbc.co.uk/weather';

describe('demo support start page', () => {
  test('renders prominent fictional-data guidance and a direct start destination', async () => {
    const response = await request(createApp()).get('/demo/support/start');

    expect(response.status).toBe(200);
    expect(response.text.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(response.text).toContain('Request emergency housing support');
    expect(response.text).toContain(
      'This is a fictional demonstration. Do not enter real personal information.',
    );
    expect(response.text).toContain(
      'It does not provide emergency housing support or contact a real caseworker.',
    );
    expect(response.text).toMatch(
      /<a\b(?=[^>]*href="\/demo\/support\/eligibility")(?=[^>]*class="[^"]*\bgovuk-button--start\b[^"]*")[^>]*>/,
    );
    expect(response.text).toContain('Start now');
    expect(response.text).toMatch(
      /<a\b(?=[^>]*href="\/demo")(?=[^>]*class="[^"]*\bgovuk-service-navigation__link\b[^"]*")[^>]*>\s*Demo home\s*<\/a>/,
    );
  });

  test('renders all required start and safety guidance components', async () => {
    const response = await request(createApp()).get('/demo/support/start').expect(200);

    expect(response.text).toContain('What this fictional service covers');
    expect(response.text).toMatch(
      /<div\b(?=[^>]*id="support-types")(?=[^>]*class="[^"]*\bgovuk-accordion\b[^"]*")(?=[^>]*data-module="govuk-accordion")[^>]*>/,
    );
    expect(response.text).toContain('Temporary accommodation');
    expect(response.text).toContain('Support to stay safely at home');
    expect(response.text).toContain('Practical support');
    expect(response.text).toMatch(/<details\b[^>]*class="[^"]*\bgovuk-details\b[^"]*"[^>]*>/);
    expect(response.text).toContain('How Exit this page works');
    expect(response.text).toContain('It does not remove this service from your browser history');
    expect(response.text).toMatch(/<div\b[^>]*class="[^"]*\bgovuk-inset-text\b[^"]*"[^>]*>/);
    expect(response.text).toContain(
      'This demo keeps made-up answers in your current session only.',
    );
    expect(response.text).toMatch(/<div\b[^>]*class="[^"]*\bgovuk-warning-text\b[^"]*"[^>]*>/);
    expect(response.text).toContain('If continuing could put you at risk');
  });

  test('renders persistent safe exit actions that remain usable without JavaScript', async () => {
    const response = await request(createApp()).get('/demo/support/start').expect(200);

    expect(response.text).toMatch(
      /<div\b(?=[^>]*class="[^"]*\bgovuk-exit-this-page\b[^"]*")(?=[^>]*data-module="govuk-exit-this-page")[^>]*>/,
    );
    expect(response.text).toMatch(
      new RegExp(
        `<a\\b(?=[^>]*href="${safeExitUrl}")(?=[^>]*class="[^"]*\\bgovuk-exit-this-page__button\\b[^"]*")(?=[^>]*rel="nofollow noreferrer")(?![^>]*target=)[^>]*>`,
      ),
    );
    expect(response.text).toContain(
      '<span class="govuk-visually-hidden">Emergency</span> Exit this page',
    );
    expect(response.text).toMatch(
      new RegExp(
        `<a\\b(?=[^>]*href="${safeExitUrl}")(?=[^>]*class="[^"]*\\bgovuk-js-exit-this-page-skiplink\\b[^"]*")(?=[^>]*rel="nofollow noreferrer")[^>]*>\\s*Exit this page\\s*</a>`,
      ),
    );

    const demoHome = await request(createApp()).get('/demo').expect(200);
    expect(demoHome.text).not.toContain('govuk-exit-this-page');
    expect(demoHome.text).not.toContain('govuk-js-exit-this-page-skiplink');
  });
});
