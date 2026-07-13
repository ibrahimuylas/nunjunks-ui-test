const request = require('supertest');
const { createApp } = require('../../src/app/app');
const { demoCaseworkRecords } = require('../../src/app/config/demo-casework-records');
const journeyService = require('../../src/app/services/journey-service');

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

describe('demo casework request details', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders protected request details using hierarchy and summary-list cards', async () => {
    const agent = await signedInAgent();
    const response = await agent
      .get('/demo/casework/requests/DEMO-CW-2006?tab=my-requests&page=2')
      .expect(200);

    expect(response.text.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(response.text).toContain('Request DEMO-CW-2006');
    expect(response.text).toContain('Demo household Linden');
    expect(response.text).toContain('7 July 2026');
    expect(response.text).toContain('Somewhere safe to stay, Health and wellbeing support');
    expect(response.text).toContain('demo-only-linden-summary.png');
    expect(response.text.match(/class="govuk-summary-card(?: |")/g)).toHaveLength(2);
    expect(response.text).toMatch(/<nav\b[^>]*class="[^"]*\bgovuk-breadcrumbs\b/);
    expect(response.text).toContain('View audit information');
    expect(response.text).toContain(
      'Assigned to the current fictional caseworker for demonstration.',
    );
    expect(response.text).not.toMatch(/class="[^"]*\bgovuk-back-link\b/);
  });

  test('preserves the exact validated queue context in every hierarchical action', async () => {
    const agent = await signedInAgent();
    const response = await agent
      .get('/demo/casework/requests/DEMO-CW-2006?tab=my-requests&page=2')
      .expect(200);

    expect(
      response.text.match(/href="\/demo\/casework\/queue\?tab=my-requests&amp;page=2"/g),
    ).toHaveLength(2);
    expect(response.text).toContain(
      'href="/demo/casework/requests/DEMO-CW-2006/decision?tab=my-requests&amp;page=2"',
    );
    expect(response.text).toContain('Return to my requests queue');
  });

  test('canonicalizes invalid or extraneous queue context before rendering', async () => {
    const agent = await signedInAgent();

    await agent
      .get('/demo/casework/requests/DEMO-CW-1001')
      .query({ tab: 'unknown', page: '0' })
      .expect(302)
      .expect('Location', '/demo/casework/requests/DEMO-CW-1001?tab=unassigned&page=1');

    await agent
      .get('/demo/casework/requests/DEMO-CW-2006')
      .query({
        tab: 'my-requests',
        page: '2',
        returnUrl: 'https://example.invalid/unsafe',
      })
      .expect(302)
      .expect('Location', '/demo/casework/requests/DEMO-CW-2006?tab=my-requests&page=2');
  });

  test('returns not found for an unknown fictional request', async () => {
    const agent = await signedInAgent();
    const response = await agent
      .get('/demo/casework/requests/DEMO-CW-9999?tab=completed&page=2')
      .expect(404);

    expect(response.text).toContain('Page not found');
    expect(response.text).not.toContain('Request DEMO-CW-9999');
  });

  test('escapes card and audit text while never exposing file contents', async () => {
    const agent = await signedInAgent();
    const seededRecord = demoCaseworkRecords[0];

    jest.spyOn(journeyService, 'getDemoCaseworkRequest').mockReturnValue({
      record: {
        ...seededRecord,
        applicantAlias: '<strong>Unsafe alias</strong>',
        summary: {
          ...seededRecord.summary,
          description: '<script>Unsafe description</script>',
        },
        auditText: '<img src=x onerror=alert(1)>',
        evidenceContents: 'sensitive file bytes',
      },
      queueContext: { tab: 'unassigned', page: 1 },
      requiresCanonicalRedirect: false,
    });

    const response = await agent
      .get('/demo/casework/requests/DEMO-CW-1001?tab=unassigned&page=1')
      .expect(200);

    expect(response.text).toContain('&lt;strong&gt;Unsafe alias&lt;/strong&gt;');
    expect(response.text).toContain('&lt;script&gt;Unsafe description&lt;/script&gt;');
    expect(response.text).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(response.text).not.toContain('<strong>Unsafe alias</strong>');
    expect(response.text).not.toContain('<script>Unsafe description</script>');
    expect(response.text).not.toContain('sensitive file bytes');
  });
});
