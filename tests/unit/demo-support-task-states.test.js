const journeyService = require('../../src/app/services/journey-service');

function eligibleSession(completion = {}) {
  return {
    demo: {
      support: {
        values: { eligibility: 'eligible' },
        completion: { ...completion },
      },
    },
  };
}

function statusFor(session, stepKey) {
  return journeyService.getDemoSupportTaskStates(session).find((task) => task.key === stepKey)
    .status;
}

describe('demo support task-state service', () => {
  test('produces all 4 meaningful statuses from one mixed-state fixture', () => {
    const session = eligibleSession({
      aboutYou: true,
      supportNeeds: false,
    });

    expect(
      journeyService
        .getDemoSupportTaskStates(session)
        .map(({ key, status, available }) => ({ key, status, available })),
    ).toEqual([
      { key: 'aboutYou', status: 'completed', available: true },
      { key: 'supportNeeds', status: 'in-progress', available: true },
      { key: 'evidence', status: 'not-started', available: true },
      { key: 'checkAnswers', status: 'cannot-start-yet', available: false },
    ]);
  });

  test('distinguishes an unvisited task from a visited and a completed task', () => {
    const session = eligibleSession();

    expect(statusFor(session, 'aboutYou')).toBe('not-started');

    journeyService.markDemoSupportStepVisited(session, 'aboutYou');
    expect(journeyService.getDemoSupportState(session).completion.aboutYou).toBe(false);
    expect(statusFor(session, 'aboutYou')).toBe('in-progress');

    journeyService.markDemoSupportStepCompleted(session, 'aboutYou');
    expect(journeyService.getDemoSupportState(session).completion.aboutYou).toBe(true);
    expect(statusFor(session, 'aboutYou')).toBe('completed');

    journeyService.markDemoSupportStepVisited(session, 'aboutYou');
    expect(journeyService.getDemoSupportState(session).completion.aboutYou).toBe(true);
    expect(statusFor(session, 'aboutYou')).toBe('completed');
  });

  test.each([
    [{}, '/demo/support/about-you'],
    [{ aboutYou: true }, '/demo/support/support-needs'],
    [{ aboutYou: true, supportNeeds: true }, '/demo/support/evidence'],
    [{ aboutYou: true, supportNeeds: true, evidence: true }, null],
  ])('selects the first incomplete required section in configured order', (completion, path) => {
    const session = eligibleSession(completion);

    expect(journeyService.getDemoSupportFirstIncompletePath(session)).toBe(path);
    expect(journeyService.getDemoSupportAccessRedirect('checkAnswers', session)).toBe(path);
  });

  test.each([
    [undefined, 'not-started'],
    [false, 'in-progress'],
    [true, 'completed'],
  ])('maps check-answers completion metadata %s to %s once unlocked', (value, status) => {
    const completion = { aboutYou: true, supportNeeds: true, evidence: true };

    if (value !== undefined) {
      completion.checkAnswers = value;
    }

    expect(statusFor(eligibleSession(completion), 'checkAnswers')).toBe(status);
  });

  test('keeps check answers locked when stale completion metadata exists', () => {
    const session = eligibleSession({ checkAnswers: true });

    expect(statusFor(session, 'checkAnswers')).toBe('cannot-start-yet');
    expect(journeyService.getDemoSupportAccessRedirect('checkAnswers', session)).toBe(
      '/demo/support/about-you',
    );
  });

  test.each([
    [{}, '/demo/support/eligibility'],
    [
      {
        demo: {
          support: {
            values: { eligibility: 'ineligible' },
            completion: {},
          },
        },
      },
      '/demo/support/ineligible',
    ],
  ])('requires an eligible answer before a support section is accessible', (session, path) => {
    expect(journeyService.getDemoSupportAccessRedirect('aboutYou', session)).toBe(path);
  });

  test('allows every section route after eligibility and uses a safe fallback for unknown steps', () => {
    const session = eligibleSession();

    expect(journeyService.getDemoSupportAccessRedirect('taskList', session)).toBeNull();
    expect(journeyService.getDemoSupportAccessRedirect('aboutYou', session)).toBeNull();
    expect(journeyService.getDemoSupportAccessRedirect('supportNeeds', session)).toBeNull();
    expect(journeyService.getDemoSupportAccessRedirect('evidence', session)).toBeNull();
    expect(journeyService.getDemoSupportAccessRedirect('unknown', session)).toBe(
      '/demo/support/start',
    );
  });

  test('rejects unknown task keys without creating support state', () => {
    const session = {};

    expect(() => journeyService.markDemoSupportStepVisited(session, 'unknown')).toThrow(
      'Demo support task key must be allow-listed',
    );
    expect(() => journeyService.markDemoSupportStepCompleted(session, '__proto__')).toThrow(
      'Demo support task key must be allow-listed',
    );
    expect(session).toEqual({});
  });
});
