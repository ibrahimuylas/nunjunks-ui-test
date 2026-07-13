const {
  caseworkPaths,
  createCaseworkAgent,
  createSignedInCaseworkAgent,
  decisionPath,
  expectBackLink,
  expectSelectedQueue,
  getSelectedQueuePanel,
  journeyRecord,
  outcomePath,
  queuePath,
  recordDecision,
  requestPath,
  signInCaseworker,
} = require('../helpers/demo-casework');
const { chooseEligibility, supportPaths } = require('../helpers/demo-support');

function expectLinkedError(response, href, message, fieldErrorId = href.slice(1)) {
  expect(response.text).toMatch(/class="[^"]*\bgovuk-error-summary\b/);
  expect(response.text).toMatch(new RegExp(`<a\\b[^>]*href="${href}"[^>]*>\\s*${message}\\s*</a>`));
  expect(response.text).toMatch(
    new RegExp(`id="${fieldErrorId}-error"[^>]*class="[^"]*\\bgovuk-error-message\\b`),
  );
}

describe('complete demo caseworker journey', () => {
  test('filters, paginates, reviews, decides and returns to the same queue context', async () => {
    const agent = createCaseworkAgent();

    const home = await agent.get(caseworkPaths.home).expect(200);
    expect(home.text).toContain(`href="${caseworkPaths.signIn}"`);
    expect(home.text).toContain(`action="${caseworkPaths.reset}"`);
    expect(home.text).toContain('Act as a fictional caseworker');

    const signIn = await agent.get(caseworkPaths.signIn).expect(200);
    expect(signIn.text).toContain('It is not real authentication.');
    expect(signIn.text).toContain('Do not use a real password.');
    expectBackLink(signIn.text, caseworkPaths.home);
    await signInCaseworker(agent);

    const defaultQueue = await agent.get(caseworkPaths.queue).expect(200);
    expect(defaultQueue.text).toContain('Fictional support request queue');
    expect(defaultQueue.text).toContain('New fictional work');
    expectSelectedQueue(defaultQueue.text, 'unassigned', 'Unassigned');

    const firstPage = await agent.get(queuePath('my-requests', 1)).expect(200);
    const firstPagePanel = getSelectedQueuePanel(firstPage.text, 'my-requests');
    expectSelectedQueue(firstPage.text, 'my-requests', 'My requests');
    expect(firstPagePanel).toContain(journeyRecord.reference);
    expect(firstPagePanel).not.toContain('DEMO-CW-2006');
    expect(firstPagePanel).toContain('href="/demo/casework/queue?tab=my-requests&amp;page=2"');

    const secondPage = await agent.get(queuePath('my-requests', 2)).expect(200);
    const secondPagePanel = getSelectedQueuePanel(secondPage.text, 'my-requests');
    expectSelectedQueue(secondPage.text, 'my-requests', 'My requests');
    expect(secondPagePanel).toContain('DEMO-CW-2006');
    expect(secondPagePanel).not.toContain(journeyRecord.reference);
    expect(secondPagePanel).toContain('href="/demo/casework/queue?tab=my-requests&amp;page=1"');

    const detailsPath = requestPath(journeyRecord.reference, 'my-requests', 1);
    const details = await agent.get(detailsPath).expect(200);
    expect(details.text).toContain(`Request ${journeyRecord.reference}`);
    expect(details.text).toContain(journeyRecord.applicantAlias);
    expect(details.text).toContain(journeyRecord.evidenceFilename);
    expect(details.text).toContain('View audit information');
    expect(details.text).toContain(`href="${queuePath('my-requests', 1).replace('&', '&amp;')}"`);
    expect(details.text).toContain(
      `href="${decisionPath(journeyRecord.reference, 'my-requests', 1).replace('&', '&amp;')}"`,
    );
    await agent.get(detailsPath).expect(200);

    const formPath = decisionPath(journeyRecord.reference, 'my-requests', 1);
    const decision = await agent.get(formPath).expect(200);
    expect(decision.text).toContain(`Record a decision for ${journeyRecord.reference}`);
    expect(decision.text).toContain('Saving will move this fictional request to Completed');
    expectBackLink(decision.text, detailsPath.replace('&', '&amp;'));

    const savedOutcomePath = await recordDecision(agent);
    const outcome = await agent.get(savedOutcomePath).expect(200);
    expect(outcome.text).toMatch(
      /class="[^"]*\bgovuk-notification-banner--success\b[^"]*"[^>]*role="alert"/,
    );
    expect(outcome.text).toContain(
      `Fictional request ${journeyRecord.reference} was recorded as Priority for this demonstration.`,
    );
    expect(outcome.text).toContain(`href="${queuePath('my-requests', 1).replace('&', '&amp;')}"`);
    expect((await agent.get(savedOutcomePath).expect(200)).text).toContain(
      `Fictional request ${journeyRecord.reference} was recorded as Priority for this demonstration.`,
    );

    const returnedQueue = await agent.get(queuePath('my-requests', 1)).expect(200);
    expectSelectedQueue(returnedQueue.text, 'my-requests', 'My requests');
    expect(getSelectedQueuePanel(returnedQueue.text, 'my-requests')).not.toContain(
      journeyRecord.reference,
    );

    const completedQueue = await agent.get(queuePath('completed', 1)).expect(200);
    const completedPanel = getSelectedQueuePanel(completedQueue.text, 'completed');
    expect(completedPanel).toMatch(
      new RegExp(
        `${journeyRecord.reference}[\\s\\S]*?<strong\\b[^>]*class="[^"]*\\bgovuk-tag--red\\b[^"]*"[^>]*>\\s*Priority\\s*</strong>`,
      ),
    );

    const persistedDetails = await agent
      .get(requestPath(journeyRecord.reference, 'completed', 1))
      .expect(200);
    expect(persistedDetails.text).toContain('Priority');
  });

  test('recovers from sign-in and decision validation errors without losing safe input', async () => {
    const agent = createCaseworkAgent();
    const signInError = await agent
      .post(caseworkPaths.signIn)
      .type('form')
      .send({ password: '   ' })
      .expect(400);

    expectLinkedError(signInError, '#password', 'Enter a demonstration password');
    expect(signInError.text).not.toMatch(/<input\b[^>]*name="password"[^>]*value=/);
    await signInCaseworker(agent);

    const formPath = decisionPath('DEMO-CW-1001', 'unassigned', 1);
    const decisionError = await agent
      .post(formPath)
      .type('form')
      .send({ decision: 'not-allow-listed', caseNote: '  Retain <fictional> note  ' })
      .expect(400);

    expectLinkedError(decisionError, '#decision', 'Select a demonstration decision from the list');
    expect(decisionError.text).toContain('Retain &lt;fictional&gt; note');
    expect(decisionError.text).not.toContain('<fictional>');

    await recordDecision(agent, {
      reference: 'DEMO-CW-1001',
      tab: 'unassigned',
      decision: { decision: 'standard', caseNote: 'Recovered fictional decision.' },
    });
    const recovered = await agent.get(outcomePath('DEMO-CW-1001', 'unassigned', 1)).expect(200);
    expect(recovered.text).toContain(
      'Fictional request DEMO-CW-1001 was recorded as Standard for this demonstration.',
    );
  });

  test('guards every protected caseworker route until this session signs in', async () => {
    const agent = createCaseworkAgent();
    const protectedRequests = [
      ['get', caseworkPaths.queue],
      ['get', requestPath('DEMO-CW-1001', 'unassigned', 1)],
      ['get', decisionPath('DEMO-CW-1001', 'unassigned', 1)],
      ['post', decisionPath('DEMO-CW-1001', 'unassigned', 1)],
      ['get', outcomePath('DEMO-CW-1001', 'unassigned', 1)],
    ];

    for (const [method, path] of protectedRequests) {
      await agent[method](path).expect(302).expect('Location', caseworkPaths.signIn);
    }

    await signInCaseworker(agent);
    await agent.get(caseworkPaths.signIn).expect(302).expect('Location', caseworkPaths.queue);
    await agent.get(outcomePath('DEMO-CW-1001', 'unassigned', 1)).expect(404);
    await agent.get(caseworkPaths.reset).expect(404);
  });

  test('canonicalizes unsafe context and returns not found for invalid request IDs', async () => {
    const agent = await createSignedInCaseworkAgent();

    await agent
      .get(`${caseworkPaths.queue}?tab=unknown&page=0&returnUrl=https://example.invalid`)
      .expect(302)
      .expect('Location', queuePath('unassigned', 1));
    await agent
      .get(`${caseworkPaths.queue}?tab=my-requests&page=99`)
      .expect(302)
      .expect('Location', queuePath('my-requests', 2));

    await agent
      .get('/demo/casework/requests/DEMO-CW-1001?tab=unknown&page=0&extra=unsafe')
      .expect(302)
      .expect('Location', requestPath('DEMO-CW-1001', 'unassigned', 1));
    await agent
      .get('/demo/casework/requests/DEMO-CW-1001/decision?tab=unknown&page=0&extra=unsafe')
      .expect(302)
      .expect('Location', decisionPath('DEMO-CW-1001', 'unassigned', 1));

    const unknownReference = 'DEMO-CW-9999';
    await agent.get(requestPath(unknownReference, 'completed', 1)).expect(404);
    await agent.get(decisionPath(unknownReference, 'completed', 1)).expect(404);
    await agent
      .post(decisionPath(unknownReference, 'completed', 1))
      .type('form')
      .send({ decision: 'standard' })
      .expect(404);
    await agent.get(outcomePath(unknownReference, 'completed', 1)).expect(404);
    await agent.get(outcomePath('DEMO-CW-1001', 'unassigned', 1)).expect(404);

    await recordDecision(agent, {
      reference: 'DEMO-CW-1001',
      tab: 'unassigned',
      decision: { decision: 'standard' },
    });
    await agent
      .get(
        '/demo/casework/requests/DEMO-CW-1001/decision/outcome?tab=completed&page=99&returnUrl=https://example.invalid',
      )
      .expect(302)
      .expect('Location', outcomePath('DEMO-CW-1001', 'unassigned', 1));
  });

  test('resets only this casework session and preserves public and independent-agent state', async () => {
    const firstAgent = createCaseworkAgent();
    const secondAgent = createCaseworkAgent();

    await chooseEligibility(firstAgent);
    await signInCaseworker(firstAgent);
    await signInCaseworker(secondAgent);
    await recordDecision(firstAgent, {
      reference: 'DEMO-CW-1001',
      tab: 'unassigned',
      decision: { decision: 'priority', caseNote: 'First session only.' },
    });

    const secondQueue = await secondAgent.get(queuePath('unassigned', 1)).expect(200);
    const secondPanel = getSelectedQueuePanel(secondQueue.text, 'unassigned');
    expect(secondPanel).toMatch(/DEMO-CW-1001[\s\S]*?>\s*Unassigned\s*</);
    await secondAgent.get(outcomePath('DEMO-CW-1001', 'unassigned', 1)).expect(404);
    const secondOutcomePath = await recordDecision(secondAgent, {
      reference: 'DEMO-CW-1002',
      tab: 'unassigned',
      decision: { decision: 'standard', caseNote: 'Second session remains saved.' },
    });

    await firstAgent.post(caseworkPaths.reset).expect(302).expect('Location', caseworkPaths.home);
    await firstAgent.get(supportPaths.tasks).expect(200);
    const retainedEligibility = await firstAgent.get(supportPaths.eligibility).expect(200);
    expect(retainedEligibility.text).toMatch(/value="eligible"[^>]*checked/);
    await firstAgent.get(caseworkPaths.queue).expect(302).expect('Location', caseworkPaths.signIn);

    await signInCaseworker(firstAgent);
    const restoredQueue = await firstAgent.get(queuePath('unassigned', 1)).expect(200);
    expect(getSelectedQueuePanel(restoredQueue.text, 'unassigned')).toMatch(
      /DEMO-CW-1001[\s\S]*?>\s*Unassigned\s*</,
    );
    await firstAgent.get(outcomePath('DEMO-CW-1001', 'unassigned', 1)).expect(404);

    const unaffectedOutcome = await secondAgent.get(secondOutcomePath).expect(200);
    expect(unaffectedOutcome.text).toContain(
      'Fictional request DEMO-CW-1002 was recorded as Standard for this demonstration.',
    );
  });
});
