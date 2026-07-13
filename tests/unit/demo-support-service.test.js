const journeySteps = require('../../src/app/config/journey-steps');
const journeyService = require('../../src/app/services/journey-service');

function completedSupportSession() {
  const session = {};

  journeyService.saveDemoSupportEligibility(session, 'eligible');
  journeyService.completeDemoSupportAboutYou(session, {
    fullName: 'Alex Example',
    dateOfBirth: { day: '7', month: '9', year: '1990', iso: '1990-09-07' },
    country: 'scotland',
  });
  journeyService.completeDemoSupportNeeds(session, {
    supportTypes: ['safe-accommodation'],
    description: 'A fictional support description',
    additionalInformation: '',
  });
  journeyService.completeDemoSupportEvidence(session, { filename: null });

  return session;
}

describe('demo support service', () => {
  test.each([
    ['eligible', '/demo/support/tasks'],
    ['ineligible', '/demo/support/ineligible'],
  ])('applies the configured %s branch through the journey facade', (eligibility, path) => {
    const session = {};

    expect(journeySteps.isDemoSupportEligibility(eligibility)).toBe(true);
    expect(journeyService.saveDemoSupportEligibility(session, eligibility)).toBe(false);
    expect(journeyService.getDemoSupportNextPath('eligibility', session)).toBe(path);
    expect(journeyService.getDemoSupportState(session).values.eligibility).toBe(eligibility);
  });

  test('does not store an unknown branch value', () => {
    const session = {};

    expect(journeySteps.isDemoSupportEligibility('unknown')).toBe(false);
    expect(() => journeyService.saveDemoSupportEligibility(session, 'unknown')).toThrow(
      'Demo support eligibility must be an allow-listed value',
    );
    expect(session).toEqual({});
  });

  test('does not coerce non-string values into configured branch keys', () => {
    const session = {};

    expect(journeySteps.isDemoSupportEligibility(['eligible'])).toBe(false);
    expect(journeySteps.getDemoSupportNextPath('eligibility', { eligibility: ['eligible'] })).toBe(
      '/demo/support/eligibility',
    );
    expect(() => journeyService.saveDemoSupportEligibility(session, ['eligible'])).toThrow(
      'Demo support eligibility must be an allow-listed value',
    );
    expect(session).toEqual({});
  });

  test('uses safe configured fallbacks when the support step or answer is missing', () => {
    expect(journeySteps.getDemoSupportNextPath('eligibility', {})).toBe(
      '/demo/support/eligibility',
    );
    expect(journeySteps.getDemoSupportNextPath('unknown', {})).toBe('/demo/support/start');
  });

  test('allow-lists fixed change routes and never derives a destination from request input', () => {
    const session = {
      demo: {
        support: {
          values: { eligibility: 'eligible' },
          completion: { aboutYou: true, supportNeeds: true, evidence: true },
        },
      },
    };

    expect(journeyService.getDemoSupportChangePath('eligibility')).toBe(
      '/demo/support/eligibility/change',
    );
    expect(journeyService.getDemoSupportChangePath('aboutYou')).toBe(
      '/demo/support/about-you/change',
    );
    expect(journeyService.getDemoSupportChangePath('supportNeeds')).toBe(
      '/demo/support/support-needs/change',
    );
    expect(journeyService.getDemoSupportChangePath('evidence')).toBe(
      '/demo/support/evidence/change',
    );
    expect(journeyService.getDemoSupportChangeReturnPath('eligibility', session)).toBe(
      '/demo/support/check-answers',
    );
    expect(journeyService.getDemoSupportChangeReturnPath('aboutYou', session)).toBe(
      '/demo/support/check-answers',
    );
    expect(() => journeyService.getDemoSupportChangePath('https://example.com')).toThrow(
      'Demo support change step key must be allow-listed',
    );
    expect(journeyService.getDemoSupportChangeReturnPath('eligibility', {})).toBe(
      '/demo/support/eligibility',
    );
    expect(journeyService.getDemoSupportChangeReturnPath('aboutYou', {})).toBe(
      '/demo/support/eligibility',
    );
  });

  test('routes eligibility changes to the outcome or first incomplete task', () => {
    const session = {
      demo: {
        support: {
          values: { eligibility: 'eligible', aboutYou: { fullName: 'Alex Example' } },
          completion: { aboutYou: true, supportNeeds: true, evidence: true },
        },
      },
    };

    journeyService.saveDemoSupportEligibility(session, 'ineligible');
    expect(journeyService.getDemoSupportChangeReturnPath('eligibility', session)).toBe(
      '/demo/support/ineligible',
    );

    journeyService.saveDemoSupportEligibility(session, 'eligible');
    expect(journeyService.getDemoSupportChangeReturnPath('eligibility', session)).toBe(
      '/demo/support/about-you',
    );
    expect(journeyService.getDemoSupportTaskStates(session).map((task) => task.status)).toEqual([
      'not-started',
      'not-started',
      'not-started',
      'cannot-start-yet',
    ]);
  });

  test('stores a validated support-needs section and completes its task together', () => {
    const session = {};
    const supportNeeds = {
      supportTypes: ['safe-accommodation', 'wellbeing'],
      description: 'A fictional household needs somewhere safe to stay.',
      additionalInformation: '',
    };

    journeyService.completeDemoSupportNeeds(session, supportNeeds);

    expect(journeyService.getDemoSupportState(session)).toEqual({
      values: { supportNeeds },
      completion: { supportNeeds: true },
    });
  });

  test.each([
    ['a safe filename', { filename: 'fictional-evidence.pdf' }],
    ['an explicit no-file choice', { filename: null }],
  ])('stores only %s and completes the evidence task together', (description, evidence) => {
    const session = {};

    journeyService.completeDemoSupportEvidence(session, evidence);

    expect(journeyService.getDemoSupportState(session)).toEqual({
      values: { evidence },
      completion: { evidence: true },
    });
    expect(Object.keys(session.demo.support.values.evidence)).toEqual(['filename']);
    expect(session.demo.support.values.evidence).not.toHaveProperty('buffer');
    expect(session.demo.support.values.evidence).not.toHaveProperty('path');
    expect(session.demo.support.values.evidence).not.toHaveProperty('contents');
  });

  test('keeps downstream support state when eligibility is submitted unchanged', () => {
    const support = {
      values: {
        eligibility: 'eligible',
        aboutYou: { fullName: 'Alex Example' },
        evidence: { filename: 'fictional-evidence.pdf' },
      },
      completion: { aboutYou: true, evidence: true },
    };
    const session = { demo: { support } };

    expect(journeyService.saveDemoSupportEligibility(session, 'eligible')).toBe(false);
    expect(session.demo.support).toBe(support);
    expect(journeyService.getDemoSupportState(session)).toEqual(support);
  });

  test('applies eligibility rules when callers use the generic support-value facade', () => {
    const session = {
      demo: {
        support: {
          values: { eligibility: 'eligible', aboutYou: { fullName: 'Alex Example' } },
          completion: { aboutYou: true },
        },
      },
    };

    expect(journeyService.saveDemoSupportValue(session, 'eligibility', 'ineligible')).toBe(true);
    expect(journeyService.getDemoSupportState(session)).toEqual({
      values: { eligibility: 'ineligible' },
      completion: {},
    });
  });

  test.each([
    ['eligible', 'ineligible'],
    ['ineligible', 'eligible'],
  ])(
    'clears downstream support state only when eligibility changes from %s to %s',
    (currentEligibility, nextEligibility) => {
      const legacyJourney = { answers: { fullName: 'Legacy User' }, complete: true };
      const casework = {
        values: { selectedTab: 'my-requests' },
        completion: { signedIn: true },
      };
      const session = {
        journey: legacyJourney,
        demo: {
          support: {
            values: {
              eligibility: currentEligibility,
              aboutYou: { fullName: 'Alex Example' },
              supportNeeds: ['temporary-accommodation'],
              evidence: { filename: 'fictional-evidence.pdf' },
              reference: 'DEMO-1001',
            },
            completion: {
              aboutYou: true,
              supportNeeds: true,
              evidence: true,
              submitted: true,
            },
          },
          casework,
          cookiePreference: 'accepted',
        },
      };

      expect(journeyService.saveDemoSupportEligibility(session, nextEligibility)).toBe(true);
      expect(journeyService.getDemoSupportState(session)).toEqual({
        values: { eligibility: nextEligibility },
        completion: {},
      });
      expect(session.demo.casework).toBe(casework);
      expect(session.demo.cookiePreference).toBe('accepted');
      expect(session.journey).toBe(legacyJourney);
    },
  );

  test('rechecks stored required answers instead of trusting completion metadata', () => {
    const session = {
      demo: {
        support: {
          values: {
            eligibility: 'eligible',
            aboutYou: {
              fullName: 'Alex Example',
              dateOfBirth: { day: '7', month: '9', year: '1990', iso: '1990-09-07' },
              country: 'scotland',
            },
            evidence: { filename: null },
          },
          completion: {
            aboutYou: true,
            supportNeeds: true,
            evidence: true,
          },
        },
      },
    };

    expect(journeyService.getDemoSupportSubmissionRedirect(session)).toBe(
      '/demo/support/support-needs',
    );
    expect(journeyService.submitDemoSupportRequest(session)).toEqual({
      submitted: false,
      replayed: false,
      reference: null,
      redirectPath: '/demo/support/support-needs',
    });
    expect(journeyService.getDemoSupportState(session).values.reference).toBeUndefined();
    expect(journeyService.getDemoSupportState(session).completion.submitted).toBeUndefined();
  });

  test.each([
    [
      'About you',
      (session) => {
        session.demo.support.values.aboutYou.fullName = '';
      },
      '/demo/support/about-you',
    ],
    [
      'Support needs',
      (session) => {
        session.demo.support.values.supportNeeds.supportTypes = ['unknown'];
      },
      '/demo/support/support-needs',
    ],
    [
      'Evidence',
      (session) => {
        session.demo.support.values.evidence = { filename: 'unsafe.exe' };
      },
      '/demo/support/evidence',
    ],
  ])('revalidates the stored %s answer before submission', (section, makeInvalid, path) => {
    const session = completedSupportSession();
    makeInvalid(session);

    expect(journeyService.getDemoSupportSubmissionRedirect(session)).toBe(path);
    expect(journeyService.submitDemoSupportRequest(session)).toMatchObject({
      submitted: false,
      reference: null,
      redirectPath: path,
    });
  });

  test('creates one stable fictional reference for first submission and replay', () => {
    const session = completedSupportSession();

    const firstSubmission = journeyService.submitDemoSupportRequest(session);
    const replayedSubmission = journeyService.submitDemoSupportRequest(session);

    expect(firstSubmission).toEqual({
      submitted: true,
      replayed: false,
      reference: expect.stringMatching(/^DEMO-[A-F0-9]{8}$/),
      redirectPath: null,
    });
    expect(replayedSubmission).toEqual({
      submitted: true,
      replayed: true,
      reference: firstSubmission.reference,
      redirectPath: null,
    });
    expect(journeyService.getDemoSupportState(session)).toMatchObject({
      values: { reference: firstSubmission.reference },
      completion: { checkAnswers: true, submitted: true },
    });
    expect(journeyService.getDemoSupportConfirmationAccessRedirect(session)).toBeNull();
  });

  test('invalidates submission only when a later answer changes', () => {
    const session = completedSupportSession();
    const { reference } = journeyService.submitDemoSupportRequest(session);
    const originalAboutYou = journeyService.getDemoSupportState(session).values.aboutYou;

    journeyService.completeDemoSupportAboutYou(session, originalAboutYou);
    expect(journeyService.getDemoSupportState(session)).toMatchObject({
      values: { reference },
      completion: { checkAnswers: true, submitted: true },
    });

    journeyService.completeDemoSupportAboutYou(session, {
      ...originalAboutYou,
      fullName: 'Jordan Example',
    });

    expect(journeyService.getDemoSupportState(session)).toMatchObject({
      values: { reference: null, aboutYou: { fullName: 'Jordan Example' } },
      completion: { aboutYou: true, checkAnswers: false, submitted: false },
    });
    expect(journeyService.getDemoSupportConfirmationAccessRedirect(session)).toBe(
      '/demo/support/check-answers',
    );
  });

  test('guards confirmation at the earliest incomplete route before submission', () => {
    expect(journeyService.getDemoSupportConfirmationAccessRedirect({})).toBe(
      '/demo/support/eligibility',
    );
    expect(journeyService.getDemoSupportConfirmationAccessRedirect(completedSupportSession())).toBe(
      '/demo/support/check-answers',
    );
  });
});
