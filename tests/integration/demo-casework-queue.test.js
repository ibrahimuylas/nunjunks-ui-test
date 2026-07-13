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

function expectSelectedTab(response, id, label) {
  expect(response.text).toMatch(
    new RegExp(
      `<li class="govuk-tabs__list-item[^"]*govuk-tabs__list-item--selected[^"]*">\\s*<a class="govuk-tabs__tab" href="#${id}">\\s*${label}\\s*</a>`,
    ),
  );
  expect(response.text).toMatch(new RegExp(`<div class="govuk-tabs__panel" id="${id}">`));
}

describe('demo casework queue', () => {
  test.each([
    [undefined, 'unassigned', 'Unassigned'],
    ['unassigned', 'unassigned', 'Unassigned'],
    ['my-requests', 'my-requests', 'My requests'],
    ['completed', 'completed', 'Completed'],
  ])('renders the selected %s queue using tabs and a fictional table', async (tab, id, label) => {
    const agent = await signedInAgent();
    const path = tab ? `/demo/casework/queue?tab=${tab}` : '/demo/casework/queue';
    const response = await agent.get(path).expect(200);

    expect(response.text.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(response.text).toContain('Fictional support request queue');
    expect(response.text).toMatch(
      /<div\b[^>]*class="[^"]*\bgovuk-tabs\b[^"]*"[^>]*data-module="govuk-tabs"/,
    );
    expect(response.text.match(/class="govuk-tabs__tab"/g)).toHaveLength(3);
    expect(response.text.match(/class="govuk-table(?: |")/g)).toHaveLength(3);
    expect(response.text.match(/class="govuk-pagination(?: |")/g)).toHaveLength(3);
    expectSelectedTab(response, `casework-queue-${id}`, label);
  });

  test('renders the newly assigned work notification and formatted tagged rows', async () => {
    const agent = await signedInAgent();
    const response = await agent.get('/demo/casework/queue').expect(200);

    expect(response.text).toMatch(
      /<div\b[^>]*class="[^"]*\bgovuk-notification-banner\b[^"]*"[^>]*role="region"/,
    );
    expect(response.text).toContain('New fictional work');
    expect(response.text).toContain(
      '6 newly assigned fictional requests are available in My requests.',
    );
    expect(response.text).toContain('DEMO-CW-1001');
    expect(response.text).toContain('Demo household Aster');
    expect(response.text).toContain('12 July 2026');
    expect(response.text).toContain('Immediate');
    expect(response.text.match(/class="govuk-table__row"/g)).toHaveLength(18);
    expect(response.text).toMatch(
      /<strong\b[^>]*class="[^"]*\bgovuk-tag--grey\b[^"]*"[^>]*>\s*Unassigned\s*<\/strong>/,
    );
    expect(response.text).toMatch(
      /<strong\b[^>]*class="[^"]*\bgovuk-tag--blue\b[^"]*"[^>]*>\s*Assigned\s*<\/strong>/,
    );
    expect(response.text).toMatch(
      /<strong\b[^>]*class="[^"]*\bgovuk-tag--red\b[^"]*"[^>]*>\s*Priority\s*<\/strong>/,
    );
    expect(response.text).toMatch(
      /<strong\b[^>]*class="[^"]*\bgovuk-tag--green\b[^"]*"[^>]*>\s*Standard\s*<\/strong>/,
    );
    expect(response.text).toMatch(
      /<strong\b[^>]*class="[^"]*\bgovuk-tag--yellow\b[^"]*"[^>]*>\s*More information needed\s*<\/strong>/,
    );
  });

  test.each([
    ['', '/demo/casework/queue?tab=unassigned&page=1'],
    ['unknown', '/demo/casework/queue?tab=unassigned&page=1'],
    ['completed&tab=unassigned', '/demo/casework/queue?tab=unassigned&page=1'],
  ])('canonicalizes an empty or unknown filter %p', async (tab, canonicalPath) => {
    const agent = await signedInAgent();

    await agent
      .get('/demo/casework/queue')
      .query({ tab })
      .expect(302)
      .expect('Location', canonicalPath);

    const response = await agent.get(canonicalPath).expect(200);

    expectSelectedTab(response, 'casework-queue-unassigned', 'Unassigned');
    expect(response.text).toMatch(
      /<a\b(?=[^>]*href="\/demo\/casework\/queue\?tab=unassigned")(?=[^>]*aria-current="page")[^>]*>/,
    );
    expect(response.text).not.toContain('completed&amp;tab=unassigned');
  });

  test.each(['', '0', '-1', '1.5', '2-and-more', '01'])(
    'canonicalizes invalid page %p to the first page',
    async (page) => {
      const agent = await signedInAgent();

      await agent
        .get('/demo/casework/queue')
        .query({ tab: 'my-requests', page })
        .expect(302)
        .expect('Location', '/demo/casework/queue?tab=my-requests&page=1');
    },
  );

  test('canonicalizes an out-of-range page to the last filtered page', async () => {
    const agent = await signedInAgent();

    await agent
      .get('/demo/casework/queue?tab=completed&page=99')
      .expect(302)
      .expect('Location', '/demo/casework/queue?tab=completed&page=2');
  });

  test.each([
    [
      1,
      'DEMO-CW-1001',
      'DEMO-CW-1006',
      /class="govuk-pagination__next"/,
      /class="govuk-pagination__prev"/,
    ],
    [
      2,
      'DEMO-CW-1006',
      'DEMO-CW-1001',
      /class="govuk-pagination__prev"/,
      /class="govuk-pagination__next"/,
    ],
  ])(
    'renders the expected unassigned records and boundaries on page %i',
    async (page, expectedReference, absentReference, expectedBoundary, absentBoundary) => {
      const agent = await signedInAgent();
      const response = await agent
        .get(`/demo/casework/queue?tab=unassigned&page=${page}`)
        .expect(200);
      const selectedPanel = response.text.match(
        /<div class="govuk-tabs__panel" id="casework-queue-unassigned">([\s\S]*?)<\/div>\s*(?:<\/div>|<div class="govuk-tabs__panel)/,
      );

      expect(selectedPanel).not.toBeNull();
      expect(selectedPanel[1]).toContain(expectedReference);
      expect(selectedPanel[1]).not.toContain(absentReference);
      expect(selectedPanel[1]).toMatch(expectedBoundary);
      expect(selectedPanel[1]).not.toMatch(absentBoundary);
      expect(selectedPanel[1]).toMatch(
        new RegExp(
          `<a\\b(?=[^>]*href="/demo/casework/queue\\?tab=unassigned&amp;page=${page}")(?=[^>]*aria-current="page")[^>]*>`,
        ),
      );
    },
  );

  test('carries only validated queue context into pagination and request links', async () => {
    const agent = await signedInAgent();
    const unsafeResponse = await agent
      .get('/demo/casework/queue')
      .query({
        tab: 'my-requests',
        page: '2',
        returnUrl: 'https://example.invalid/unsafe',
        decision: 'priority',
      })
      .expect(302);

    expect(unsafeResponse.headers.location).toBe('/demo/casework/queue?tab=my-requests&page=2');

    const response = await agent.get(unsafeResponse.headers.location).expect(200);

    expect(response.text).toContain(
      'href="/demo/casework/requests/DEMO-CW-2006?tab=my-requests&amp;page=2"',
    );
    expect(response.text).toContain('href="/demo/casework/queue?tab=my-requests&amp;page=1"');
    expect(response.text).not.toContain('example.invalid');
    expect(response.text).not.toContain('decision=priority');
  });

  test('provides server-followable links for every queue when JavaScript is unavailable', async () => {
    const agent = await signedInAgent();
    const response = await agent.get('/demo/casework/queue?tab=my-requests').expect(200);

    expect(response.text).toMatch(/<nav\b[^>]*aria-label="Filter fictional requests"/);

    for (const [tab, label] of [
      ['unassigned', 'Unassigned'],
      ['my-requests', 'My requests'],
      ['completed', 'Completed'],
    ]) {
      expect(response.text).toMatch(
        new RegExp(`<a\\b[^>]*href="/demo/casework/queue\\?tab=${tab}"[^>]*>\\s*${label}\\s*</a>`),
      );
    }
  });
});
