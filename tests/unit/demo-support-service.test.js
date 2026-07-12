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
