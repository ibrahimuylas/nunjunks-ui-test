const journeySteps = require('../../src/app/config/journey-steps');
const journeyService = require('../../src/app/services/journey-service');

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
});
