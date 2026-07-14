const {
  chooseEligibility,
  completeAboutYou,
  completeEvidence,
  completeSupportNeeds,
  createSupportAgent,
  expectTaskStatus,
  extractReference,
  supportPaths,
} = require('../helpers/demo-support');
const {
  caseworkPaths,
  expectSelectedQueue,
  getSelectedQueuePanel,
  journeyRecord,
  outcomePath,
  queuePath,
  recordDecision,
  signInCaseworker,
} = require('../helpers/demo-casework');

async function completeLegacyJourney(agent, fullName) {
  await agent
    .post('/business-type')
    .type('form')
    .send({ hasFarmingBusiness: 'no' })
    .expect(302)
    .expect('Location', '/full-name');
  await agent
    .post('/full-name')
    .type('form')
    .send({
      fullName,
      'dateOfBirth-day': '7',
      'dateOfBirth-month': '9',
      'dateOfBirth-year': '1990',
    })
    .expect(302)
    .expect('Location', '/updates');
  await agent
    .post('/updates')
    .type('form')
    .send({ receiveUpdates: 'yes' })
    .expect(302)
    .expect('Location', '/check-answers');
}

async function expectLegacyJourney(agent, fullName) {
  const response = await agent.get('/check-answers').expect(200);

  expect(response.text).toContain(fullName);
  expect(response.text).toContain('7 9 1990');
  expect(response.text).toMatch(/Do you have a farming business[\s\S]*?>\s*No\s*</);
  expect(response.text).toMatch(/Receive updates[\s\S]*?>\s*Yes\s*</);
}

async function saveSupportProfile(agent, fullName) {
  await chooseEligibility(agent);
  await completeAboutYou(agent, { fullName });
}

async function expectSupportProfile(agent, fullName, excludedName) {
  const eligibility = await agent.get(supportPaths.eligibility).expect(200);
  const aboutYou = await agent.get(supportPaths.aboutYou).expect(200);

  expect(eligibility.text).toMatch(/value="eligible"[^>]*checked/);
  expect(aboutYou.text).toContain(`value="${fullName}"`);

  if (excludedName) {
    expect(aboutYou.text).not.toContain(excludedName);
  }
}

async function expectUnassignedRecord(agent, reference) {
  const response = await agent.get(queuePath('unassigned', 1)).expect(200);
  const panel = getSelectedQueuePanel(response.text, 'unassigned');

  expect(panel).toMatch(new RegExp(`${reference}[\\s\\S]*?>\\s*Unassigned\\s*</`));
}

describe('demo session boundaries', () => {
  test('isolates support answers and casework decisions between independent clients', async () => {
    const firstClient = createSupportAgent();
    const secondClient = createSupportAgent();

    await completeLegacyJourney(firstClient, 'Legacy First Client');
    await completeLegacyJourney(secondClient, 'Legacy Second Client');
    await saveSupportProfile(firstClient, 'Public First Client');
    await saveSupportProfile(secondClient, 'Public Second Client');
    await signInCaseworker(firstClient);
    await signInCaseworker(secondClient);

    const firstOutcome = await recordDecision(firstClient, {
      reference: 'DEMO-CW-1001',
      tab: 'unassigned',
      decision: { decision: 'priority', caseNote: 'First client only.' },
    });

    await expectSupportProfile(firstClient, 'Public First Client', 'Public Second Client');
    await expectSupportProfile(secondClient, 'Public Second Client', 'Public First Client');
    expect((await firstClient.get(firstOutcome).expect(200)).text).toContain(
      'Fictional request DEMO-CW-1001 was recorded as Priority for this demonstration.',
    );
    await secondClient.get(outcomePath('DEMO-CW-1001', 'unassigned', 1)).expect(404);
    await expectUnassignedRecord(secondClient, 'DEMO-CW-1001');
    await expectLegacyJourney(firstClient, 'Legacy First Client');
    await expectLegacyJourney(secondClient, 'Legacy Second Client');
  });

  test('public reset clears only that client public state', async () => {
    const resetClient = createSupportAgent();
    const independentClient = createSupportAgent();

    await completeLegacyJourney(resetClient, 'Legacy Reset Client');
    await completeLegacyJourney(independentClient, 'Legacy Independent Client');
    await saveSupportProfile(resetClient, 'Public Reset Client');
    await saveSupportProfile(independentClient, 'Public Independent Client');
    await signInCaseworker(resetClient);
    await signInCaseworker(independentClient);
    const retainedCaseworkOutcome = await recordDecision(resetClient, {
      reference: 'DEMO-CW-1001',
      tab: 'unassigned',
      decision: { decision: 'priority', caseNote: 'Preserved across public reset.' },
    });
    const independentOutcome = await recordDecision(independentClient, {
      reference: 'DEMO-CW-1002',
      tab: 'unassigned',
      decision: { decision: 'standard', caseNote: 'Independent client state.' },
    });

    await resetClient.post(supportPaths.reset).expect(302).expect('Location', supportPaths.home);

    await resetClient
      .get(supportPaths.tasks)
      .expect(302)
      .expect('Location', supportPaths.eligibility);
    const resetEligibility = await resetClient.get(supportPaths.eligibility).expect(200);
    expect(resetEligibility.text).not.toMatch(/value="(?:eligible|ineligible)"[^>]*checked/);
    expect((await resetClient.get(retainedCaseworkOutcome).expect(200)).text).toContain(
      'Fictional request DEMO-CW-1001 was recorded as Priority for this demonstration.',
    );
    await expectLegacyJourney(resetClient, 'Legacy Reset Client');

    await expectSupportProfile(
      independentClient,
      'Public Independent Client',
      'Public Reset Client',
    );
    expect((await independentClient.get(independentOutcome).expect(200)).text).toContain(
      'Fictional request DEMO-CW-1002 was recorded as Standard for this demonstration.',
    );
    await expectLegacyJourney(independentClient, 'Legacy Independent Client');
  });

  test('confirmation restart preserves same-session casework state', async () => {
    const agent = createSupportAgent();
    const previousFullName = 'Public and Casework Boundary';
    const previousDescription = 'Distinctive same-session boundary description';
    const previousEvidenceFilename = 'same-session-boundary-evidence.pdf';
    const originalQueuePath = queuePath('my-requests', 1);

    await chooseEligibility(agent);
    await completeAboutYou(agent, { fullName: previousFullName });
    await completeSupportNeeds(agent, { description: previousDescription });
    await completeEvidence(agent, { filename: previousEvidenceFilename });
    await agent
      .post(supportPaths.checkAnswers)
      .expect(302)
      .expect('Location', supportPaths.confirmation);
    const previousReference = extractReference(
      (await agent.get(supportPaths.confirmation).expect(200)).text,
    );

    expect(previousReference).toMatch(/^DEMO-[A-F0-9]{8}$/);

    await signInCaseworker(agent);
    const retainedCaseworkOutcome = await recordDecision(agent, {
      reference: journeyRecord.reference,
      tab: 'my-requests',
      page: 1,
      decision: {
        decision: 'priority',
        caseNote: 'Preserved across the confirmation restart.',
      },
    });

    await agent
      .post(supportPaths.startAnother)
      .expect(302)
      .expect('Location', supportPaths.start);
    await agent
      .get(supportPaths.confirmation)
      .expect(302)
      .expect('Location', supportPaths.eligibility);

    const restartedEligibility = await agent.get(supportPaths.eligibility).expect(200);
    expect(restartedEligibility.text).not.toMatch(
      /value="(?:eligible|ineligible)"[^>]*checked/,
    );
    expect(restartedEligibility.text).not.toContain(previousReference);

    await chooseEligibility(agent);
    const restartedTasks = await agent.get(supportPaths.tasks).expect(200);
    expectTaskStatus(restartedTasks.text, 'About you', 'Not started', supportPaths.aboutYou);
    expectTaskStatus(
      restartedTasks.text,
      'Support needs',
      'Not started',
      supportPaths.supportNeeds,
    );
    expectTaskStatus(restartedTasks.text, 'Evidence', 'Not started', supportPaths.evidence);
    expectTaskStatus(restartedTasks.text, 'Check your answers', 'Cannot start yet');
    expect(restartedTasks.text).not.toContain(previousReference);

    const restartedAboutYou = await agent.get(supportPaths.aboutYou).expect(200);
    expect(restartedAboutYou.text).not.toContain(previousFullName);
    expect(restartedAboutYou.text).not.toContain(previousReference);

    const restartedSupportNeeds = await agent.get(supportPaths.supportNeeds).expect(200);
    expect(restartedSupportNeeds.text).not.toContain(previousDescription);
    expect(restartedSupportNeeds.text).not.toContain(previousReference);

    const restartedEvidence = await agent.get(supportPaths.evidence).expect(200);
    expect(restartedEvidence.text).not.toContain(previousEvidenceFilename);
    expect(restartedEvidence.text).not.toContain(previousReference);

    const retainedQueue = await agent.get(originalQueuePath).expect(200);
    expectSelectedQueue(retainedQueue.text, 'my-requests', 'My requests');
    expect(retainedQueue.text).toMatch(
      new RegExp(
        `${journeyRecord.reference}[\\s\\S]*?<strong\\b[^>]*class="[^"]*\\bgovuk-tag--red\\b[^"]*"[^>]*>\\s*Priority\\s*</strong>`,
      ),
    );

    const retainedOutcome = await agent.get(retainedCaseworkOutcome).expect(200);
    expect(retainedOutcome.text).toContain(
      `Fictional request ${journeyRecord.reference} was recorded as Priority for this demonstration.`,
    );
    expect(retainedOutcome.text).toContain(
      `href="${originalQueuePath.replace('&', '&amp;')}"`,
    );
  });

  test('casework reset clears only that client casework state', async () => {
    const resetClient = createSupportAgent();
    const independentClient = createSupportAgent();

    await completeLegacyJourney(resetClient, 'Legacy Casework Reset');
    await completeLegacyJourney(independentClient, 'Legacy Casework Independent');
    await saveSupportProfile(resetClient, 'Public Casework Reset');
    await saveSupportProfile(independentClient, 'Public Casework Independent');
    await signInCaseworker(resetClient);
    await signInCaseworker(independentClient);
    const resetOutcome = await recordDecision(resetClient, {
      reference: 'DEMO-CW-1001',
      tab: 'unassigned',
      decision: { decision: 'priority', caseNote: 'Removed by casework reset.' },
    });
    const independentOutcome = await recordDecision(independentClient, {
      reference: 'DEMO-CW-1002',
      tab: 'unassigned',
      decision: { decision: 'standard', caseNote: 'Independent client state.' },
    });

    await resetClient.post(caseworkPaths.reset).expect(302).expect('Location', caseworkPaths.home);

    await resetClient.get(caseworkPaths.queue).expect(302).expect('Location', caseworkPaths.signIn);
    await resetClient.get(resetOutcome).expect(302).expect('Location', caseworkPaths.signIn);
    await signInCaseworker(resetClient);
    await resetClient.get(resetOutcome).expect(404);
    await expectUnassignedRecord(resetClient, 'DEMO-CW-1001');
    await expectSupportProfile(resetClient, 'Public Casework Reset');
    await expectLegacyJourney(resetClient, 'Legacy Casework Reset');

    await expectSupportProfile(
      independentClient,
      'Public Casework Independent',
      'Public Casework Reset',
    );
    expect((await independentClient.get(independentOutcome).expect(200)).text).toContain(
      'Fictional request DEMO-CW-1002 was recorded as Standard for this demonstration.',
    );
    await expectLegacyJourney(independentClient, 'Legacy Casework Independent');
  });
});
