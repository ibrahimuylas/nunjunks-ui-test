const { Buffer } = require('node:buffer');
const {
  chooseEligibility,
  completeAboutYou,
  completeEvidence,
  completeEvidenceWithoutFile,
  completeSupportNeeds,
  createCompletedSupportAgent,
  createSupportAgent,
  expectBackLink,
  expectTaskStatus,
  extractReference,
  supportPaths,
  validAboutYou,
  validSupportNeeds,
} = require('../helpers/demo-support');

const guardedApplicationRequests = Object.freeze([
  ['get', supportPaths.tasks],
  ['get', supportPaths.aboutYou],
  ['post', supportPaths.aboutYou],
  ['get', supportPaths.aboutYouChange],
  ['post', supportPaths.aboutYouChange],
  ['get', supportPaths.supportNeeds],
  ['post', supportPaths.supportNeeds],
  ['get', supportPaths.supportNeedsChange],
  ['post', supportPaths.supportNeedsChange],
  ['get', supportPaths.evidence],
  ['post', supportPaths.evidence],
  ['get', supportPaths.evidenceChange],
  ['post', supportPaths.evidenceChange],
  ['get', supportPaths.checkAnswers],
  ['post', supportPaths.checkAnswers],
  ['get', supportPaths.confirmation],
]);

function expectLinkedError(response, href, message, fieldErrorId = href.slice(1)) {
  expect(response.text).toMatch(/class="[^"]*\bgovuk-error-summary\b/);
  expect(response.text).toMatch(
    new RegExp(`<a\\b[^>]*href="${href}"[^>]*>\\s*${message}\\s*<\\/a>`),
  );
  expect(response.text).toMatch(
    new RegExp(`id="${fieldErrorId}-error"[^>]*class="[^"]*\\bgovuk-error-message\\b`),
  );
}

describe('complete demo support journey', () => {
  test('completes, reviews, submits and resets the eligible journey', async () => {
    const agent = createSupportAgent();

    const home = await agent.get(supportPaths.home).expect(200);
    expect(home.text).toContain(`href="${supportPaths.start}"`);
    expect(home.text).toContain(`action="${supportPaths.reset}"`);

    const start = await agent.get(supportPaths.start).expect(200);
    expect(start.text).toContain('This is a fictional demonstration.');
    expect(start.text).toContain(`href="${supportPaths.eligibility}"`);
    expect(start.text).toContain(`href="${supportPaths.home}"`);

    const eligibility = await agent.get(supportPaths.eligibility).expect(200);
    expectBackLink(eligibility.text, supportPaths.start);
    await chooseEligibility(agent);

    let tasks = await agent.get(supportPaths.tasks).expect(200);
    expectBackLink(tasks.text, supportPaths.eligibility);
    expectTaskStatus(tasks.text, 'About you', 'Not started', supportPaths.aboutYou);
    expectTaskStatus(tasks.text, 'Support needs', 'Not started', supportPaths.supportNeeds);
    expectTaskStatus(tasks.text, 'Evidence', 'Not started', supportPaths.evidence);
    expectTaskStatus(tasks.text, 'Check your answers', 'Cannot start yet');

    const aboutYou = await agent.get(supportPaths.aboutYou).expect(200);
    expectBackLink(aboutYou.text, supportPaths.tasks);
    tasks = await agent.get(supportPaths.tasks).expect(200);
    expectTaskStatus(tasks.text, 'About you', 'In progress', supportPaths.aboutYou);
    await completeAboutYou(agent);
    tasks = await agent.get(supportPaths.tasks).expect(200);
    expectTaskStatus(tasks.text, 'About you', 'Completed', supportPaths.aboutYou);

    const supportNeeds = await agent.get(supportPaths.supportNeeds).expect(200);
    expectBackLink(supportNeeds.text, supportPaths.tasks);
    tasks = await agent.get(supportPaths.tasks).expect(200);
    expectTaskStatus(tasks.text, 'Support needs', 'In progress', supportPaths.supportNeeds);
    await completeSupportNeeds(agent);
    tasks = await agent.get(supportPaths.tasks).expect(200);
    expectTaskStatus(tasks.text, 'Support needs', 'Completed', supportPaths.supportNeeds);

    const evidence = await agent.get(supportPaths.evidence).expect(200);
    expectBackLink(evidence.text, supportPaths.supportNeeds);
    tasks = await agent.get(supportPaths.tasks).expect(200);
    expectTaskStatus(tasks.text, 'Evidence', 'In progress', supportPaths.evidence);
    await completeEvidence(agent);

    tasks = await agent.get(supportPaths.tasks).expect(200);
    expectTaskStatus(tasks.text, 'Evidence', 'Completed', supportPaths.evidence);
    expectTaskStatus(tasks.text, 'Check your answers', 'Not started', supportPaths.checkAnswers);

    const checkAnswers = await agent.get(supportPaths.checkAnswers).expect(200);
    expectBackLink(checkAnswers.text, supportPaths.tasks);
    expect(checkAnswers.text).toContain('Alex Example');
    expect(checkAnswers.text).toContain('A fictional support description');
    expect(checkAnswers.text).toContain('fictional-support-evidence.pdf');
    tasks = await agent.get(supportPaths.tasks).expect(200);
    expectTaskStatus(tasks.text, 'Check your answers', 'In progress', supportPaths.checkAnswers);

    await agent
      .post(supportPaths.checkAnswers)
      .expect(302)
      .expect('Location', supportPaths.confirmation);
    const confirmation = await agent.get(supportPaths.confirmation).expect(200);
    const firstReference = extractReference(confirmation.text);

    expect(firstReference).toMatch(/^DEMO-[A-F0-9]{8}$/);
    expect(confirmation.text).toContain('Fictional request submitted');
    expect(confirmation.text).toContain(`href="${supportPaths.home}"`);
    expect(extractReference((await agent.get(supportPaths.confirmation).expect(200)).text)).toBe(
      firstReference,
    );
    await agent
      .post(supportPaths.checkAnswers)
      .expect(302)
      .expect('Location', supportPaths.confirmation);
    expect(extractReference((await agent.get(supportPaths.confirmation).expect(200)).text)).toBe(
      firstReference,
    );
    tasks = await agent.get(supportPaths.tasks).expect(200);
    expectTaskStatus(tasks.text, 'Check your answers', 'Completed', supportPaths.checkAnswers);

    await completeAboutYou(agent, { fullName: 'Jordan Example' }, supportPaths.aboutYouChange);
    await agent
      .get(supportPaths.confirmation)
      .expect(302)
      .expect('Location', supportPaths.checkAnswers);
    tasks = await agent.get(supportPaths.tasks).expect(200);
    expectTaskStatus(tasks.text, 'Check your answers', 'In progress', supportPaths.checkAnswers);

    await agent.post(supportPaths.checkAnswers).expect(302);
    const secondReference = extractReference(
      (await agent.get(supportPaths.confirmation).expect(200)).text,
    );
    expect(secondReference).toMatch(/^DEMO-[A-F0-9]{8}$/);
    expect(secondReference).not.toBe(firstReference);

    await agent.post(supportPaths.reset).expect(302).expect('Location', supportPaths.home);
    await agent.get(supportPaths.tasks).expect(302).expect('Location', supportPaths.eligibility);
    await agent
      .get(supportPaths.confirmation)
      .expect(302)
      .expect('Location', supportPaths.eligibility);
    const resetEligibility = await agent.get(supportPaths.eligibility).expect(200);
    expect(resetEligibility.text).not.toMatch(/value="eligible"[^>]*checked/);
    expect(resetEligibility.text).not.toMatch(/value="ineligible"[^>]*checked/);
  });

  test('recovers from validation errors without losing valid submitted answers', async () => {
    const agent = createSupportAgent();

    const eligibilityError = await agent
      .post(supportPaths.eligibility)
      .type('form')
      .send({ eligibility: 'unknown' })
      .expect(400);
    expectLinkedError(
      eligibilityError,
      '#eligibility',
      'Select whether the fictional request is eligible to continue',
    );
    await chooseEligibility(agent);

    const aboutYouError = await agent
      .post(supportPaths.aboutYou)
      .type('form')
      .send({
        ...validAboutYou,
        'dateOfBirth-day': '31',
        'dateOfBirth-month': '2',
      })
      .expect(400);
    expectLinkedError(
      aboutYouError,
      '#dateOfBirth-day',
      'Enter a real date of birth',
      'dateOfBirth',
    );
    expect(aboutYouError.text).toContain('value="Alex Example"');
    expect(aboutYouError.text).toMatch(/value="scotland" selected/);
    let tasks = await agent.get(supportPaths.tasks).expect(200);
    expectTaskStatus(tasks.text, 'About you', 'In progress', supportPaths.aboutYou);
    await completeAboutYou(agent);

    const longDescription = 'x'.repeat(501);
    const supportNeedsError = await agent
      .post(supportPaths.supportNeeds)
      .type('form')
      .send({ ...validSupportNeeds, description: longDescription })
      .expect(400);
    expectLinkedError(
      supportNeedsError,
      '#description',
      'Description must be 500 characters or fewer',
    );
    expect(supportNeedsError.text).toMatch(/value="safe-accommodation"[^>]*checked/);
    expect(supportNeedsError.text).toContain(longDescription);
    expect(supportNeedsError.text).toContain('Fictional follow-up details');
    tasks = await agent.get(supportPaths.tasks).expect(200);
    expectTaskStatus(tasks.text, 'Support needs', 'In progress', supportPaths.supportNeeds);
    await completeSupportNeeds(agent);

    const evidenceError = await agent
      .post(supportPaths.evidence)
      .attach('evidence', Buffer.from('fictional text'), {
        filename: 'fictional-evidence.txt',
        contentType: 'text/plain',
      })
      .expect(400);
    expectLinkedError(evidenceError, '#evidence', 'The selected file must be a PDF, JPG or PNG');
    tasks = await agent.get(supportPaths.tasks).expect(200);
    expectTaskStatus(tasks.text, 'Evidence', 'In progress', supportPaths.evidence);
    await completeEvidenceWithoutFile(agent);

    const recovered = await agent.get(supportPaths.checkAnswers).expect(200);
    expect(recovered.text).toContain('Alex Example');
    expect(recovered.text).toContain('A fictional support description');
    expect(recovered.text).toContain('No file selected');
  });

  test('guards every protected request for missing and ineligible branches', async () => {
    const missingEligibilityAgent = createSupportAgent();

    for (const [method, path] of [
      ...guardedApplicationRequests,
      ['get', supportPaths.ineligible],
      ['get', supportPaths.eligibilityChange],
      ['post', supportPaths.eligibilityChange],
    ]) {
      await missingEligibilityAgent[method](path)
        .expect(302)
        .expect('Location', supportPaths.eligibility);
    }

    const ineligibleAgent = createSupportAgent();
    await chooseEligibility(ineligibleAgent, 'ineligible');

    const outcome = await ineligibleAgent.get(supportPaths.ineligible).expect(200);
    expect(outcome.text).toContain('This fictional request cannot continue');
    expect(outcome.text).toContain(`href="${supportPaths.eligibilityChange}"`);
    await ineligibleAgent.get(supportPaths.ineligible).expect(200);

    for (const [method, path] of guardedApplicationRequests) {
      await ineligibleAgent[method](path).expect(302).expect('Location', supportPaths.ineligible);
    }

    const change = await ineligibleAgent.get(supportPaths.eligibilityChange).expect(200);
    expectBackLink(change.text, supportPaths.ineligible);
    expect(change.text).toMatch(/value="ineligible"[^>]*checked/);

    const changeError = await ineligibleAgent
      .post(supportPaths.eligibilityChange)
      .type('form')
      .send({ eligibility: 'unknown' })
      .expect(400);
    expectLinkedError(
      changeError,
      '#eligibility',
      'Select whether the fictional request is eligible to continue',
    );
    expectBackLink(changeError.text, supportPaths.ineligible);

    await ineligibleAgent
      .post(supportPaths.eligibilityChange)
      .type('form')
      .send({ eligibility: 'eligible' })
      .expect(302)
      .expect('Location', supportPaths.aboutYou);
    const tasks = await ineligibleAgent.get(supportPaths.tasks).expect(200);
    expectTaskStatus(tasks.text, 'About you', 'Not started', supportPaths.aboutYou);
    expectTaskStatus(tasks.text, 'Check your answers', 'Cannot start yet');
  });

  test('uses the configured first incomplete section for every locked route', async () => {
    const agent = createSupportAgent();
    const lockedRequests = [
      ['get', supportPaths.checkAnswers],
      ['post', supportPaths.checkAnswers],
      ['get', supportPaths.confirmation],
      ['get', supportPaths.aboutYouChange],
      ['post', supportPaths.aboutYouChange],
      ['get', supportPaths.supportNeedsChange],
      ['post', supportPaths.supportNeedsChange],
      ['get', supportPaths.evidenceChange],
      ['post', supportPaths.evidenceChange],
    ];

    await chooseEligibility(agent);

    for (const [method, path] of lockedRequests) {
      await agent[method](path).expect(302).expect('Location', supportPaths.aboutYou);
    }

    await completeAboutYou(agent);
    for (const [method, path] of lockedRequests) {
      await agent[method](path).expect(302).expect('Location', supportPaths.supportNeeds);
    }

    await completeSupportNeeds(agent);
    for (const [method, path] of lockedRequests) {
      await agent[method](path).expect(302).expect('Location', supportPaths.evidence);
    }

    await completeEvidenceWithoutFile(agent);
    await agent.get(supportPaths.checkAnswers).expect(200);
    await agent
      .get(supportPaths.confirmation)
      .expect(302)
      .expect('Location', supportPaths.checkAnswers);
    for (const path of [
      supportPaths.aboutYouChange,
      supportPaths.supportNeedsChange,
      supportPaths.evidenceChange,
    ]) {
      await agent.get(path).expect(200);
    }
  });

  test('follows every back link and every allow-listed change-answer route', async () => {
    const agent = await createCompletedSupportAgent();
    const expectedChangeLinks = [
      supportPaths.eligibilityChange,
      supportPaths.aboutYouChange,
      supportPaths.aboutYouChange,
      supportPaths.aboutYouChange,
      supportPaths.supportNeedsChange,
      supportPaths.supportNeedsChange,
      supportPaths.supportNeedsChange,
      supportPaths.evidenceChange,
    ];

    const linearPages = [
      [supportPaths.eligibility, supportPaths.start],
      [supportPaths.tasks, supportPaths.eligibility],
      [supportPaths.aboutYou, supportPaths.tasks],
      [supportPaths.supportNeeds, supportPaths.tasks],
      [supportPaths.evidence, supportPaths.supportNeeds],
      [supportPaths.checkAnswers, supportPaths.tasks],
    ];

    for (const [path, backPath] of linearPages) {
      expectBackLink((await agent.get(path).expect(200)).text, backPath);
    }

    let checkAnswers = await agent.get(supportPaths.checkAnswers).expect(200);
    const changeLinks = [
      ...checkAnswers.text.matchAll(/href="(\/demo\/support\/[^"?]+\/change)"/g),
    ].map((match) => match[1]);
    expect(changeLinks).toEqual(expectedChangeLinks);

    const eligibilityChange = await agent.get(supportPaths.eligibilityChange).expect(200);
    expectBackLink(eligibilityChange.text, supportPaths.checkAnswers);
    await agent
      .post(supportPaths.eligibilityChange)
      .type('form')
      .send({ eligibility: 'eligible', returnTo: 'https://example.com' })
      .expect(302)
      .expect('Location', supportPaths.checkAnswers);

    const aboutYouChange = await agent.get(supportPaths.aboutYouChange).expect(200);
    expectBackLink(aboutYouChange.text, supportPaths.checkAnswers);
    await completeAboutYou(
      agent,
      {
        fullName: 'Jordan Example',
        'dateOfBirth-day': '8',
        'dateOfBirth-month': '10',
        'dateOfBirth-year': '1991',
        country: 'wales',
        returnTo: '//example.com',
      },
      supportPaths.aboutYouChange,
    );

    const supportNeedsChange = await agent.get(supportPaths.supportNeedsChange).expect(200);
    expectBackLink(supportNeedsChange.text, supportPaths.checkAnswers);
    await completeSupportNeeds(
      agent,
      {
        supportTypes: 'personal-safety',
        description: 'Updated fictional support description',
        additionalInformation: '',
        returnTo: 'https://example.com',
      },
      supportPaths.supportNeedsChange,
    );

    const evidenceChange = await agent.get(supportPaths.evidenceChange).expect(200);
    expectBackLink(evidenceChange.text, supportPaths.checkAnswers);
    await completeEvidenceWithoutFile(agent, supportPaths.evidenceChange);

    checkAnswers = await agent.get(supportPaths.checkAnswers).expect(200);
    expect(checkAnswers.text).toContain('Jordan Example');
    expect(checkAnswers.text).toContain('8 October 1991');
    expect(checkAnswers.text).toContain('Wales');
    expect(checkAnswers.text).toContain('Help to stay safe');
    expect(checkAnswers.text).toContain('Updated fictional support description');
    expect(checkAnswers.text).toContain('No file selected');
    expect(checkAnswers.text).not.toContain('fictional-support-evidence.pdf');
  });
});
