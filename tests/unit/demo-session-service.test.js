const demoSessionService = require('../../src/app/services/demo-session-service');
const journeyService = require('../../src/app/services/journey-service');

const emptyScenarioState = () => ({ values: {}, completion: {} });

describe('demo session service', () => {
  test('lazily initializes support and casework in an isolated demo namespace', () => {
    const session = {};

    expect(demoSessionService.getSupportState(session)).toEqual(emptyScenarioState());
    expect(session).toEqual({ demo: { support: emptyScenarioState() } });
    expect(session.journey).toBeUndefined();

    expect(demoSessionService.getCaseworkState(session)).toEqual(emptyScenarioState());
    expect(session.demo.support).not.toBe(session.demo.casework);
    expect(session.journey).toBeUndefined();
  });

  test('stores normalized values and completion metadata in their named collections', () => {
    const session = {};

    demoSessionService.saveSupportValue(session, 'eligibility', 'eligible');
    demoSessionService.saveSupportValue(session, 'aboutYou', {
      fullName: 'Alex Example',
      dateOfBirth: { day: '1', month: '2', year: '1990' },
      countries: ['england', 'wales'],
    });
    demoSessionService.saveSupportCompletion(session, 'aboutYou', true);

    expect(demoSessionService.getSupportState(session)).toEqual({
      values: {
        eligibility: 'eligible',
        aboutYou: {
          fullName: 'Alex Example',
          dateOfBirth: { day: '1', month: '2', year: '1990' },
          countries: ['england', 'wales'],
        },
      },
      completion: { aboutYou: true },
    });
    expect(Object.keys(session.demo.support)).toEqual(['values', 'completion']);
  });

  test('rejects values that are not normalized JSON data', () => {
    const session = {};
    const sparseValues = [];
    sparseValues[1] = 'completed';

    expect(() => demoSessionService.saveSupportValue(session, 'submittedAt', new Date())).toThrow(
      'Demo session entries must be normalized JSON values',
    );
    expect(() =>
      demoSessionService.saveCaseworkCompletion(session, 'signedIn', undefined),
    ).toThrow('Demo session entries must be normalized JSON values');
    expect(() => demoSessionService.saveCaseworkValue(session, 'statuses', sparseValues)).toThrow(
      'Demo session entries must be normalized JSON values',
    );
  });

  test('rejects entry keys that could mutate the state collection prototype', () => {
    const session = {};

    expect(() => demoSessionService.saveSupportValue(session, '__proto__', 'unsafe')).toThrow(
      'Demo session entry keys must be safe non-empty strings',
    );
    expect(demoSessionService.getSupportState(session)).toEqual(emptyScenarioState());
  });

  test('returns snapshots so callers cannot mutate stored nested values', () => {
    const session = {};
    const normalizedRecord = {
      reference: 'DEMO-1001',
      statuses: ['unassigned'],
    };

    demoSessionService.saveCaseworkValue(session, 'record', normalizedRecord);
    normalizedRecord.statuses.push('completed');

    const state = demoSessionService.getCaseworkState(session);
    state.values.record.statuses.push('changed-through-snapshot');

    expect(demoSessionService.getCaseworkState(session).values.record).toEqual({
      reference: 'DEMO-1001',
      statuses: ['unassigned'],
    });
  });

  test('keeps support and casework values and completion metadata isolated', () => {
    const session = {};

    demoSessionService.saveSupportValue(session, 'reference', 'SUPPORT-1001');
    demoSessionService.saveSupportCompletion(session, 'submitted', true);
    demoSessionService.saveCaseworkValue(session, 'reference', 'CASE-2001');
    demoSessionService.saveCaseworkCompletion(session, 'signedIn', true);

    expect(demoSessionService.getSupportState(session)).toEqual({
      values: { reference: 'SUPPORT-1001' },
      completion: { submitted: true },
    });
    expect(demoSessionService.getCaseworkState(session)).toEqual({
      values: { reference: 'CASE-2001' },
      completion: { signedIn: true },
    });
  });

  test('keeps state isolated between independent sessions', () => {
    const firstSession = {};
    const secondSession = {};

    demoSessionService.saveSupportValue(firstSession, 'reference', 'SUPPORT-1001');
    demoSessionService.saveSupportValue(secondSession, 'reference', 'SUPPORT-2002');
    demoSessionService.resetSupport(firstSession);

    expect(demoSessionService.getSupportState(firstSession)).toEqual(emptyScenarioState());
    expect(demoSessionService.getSupportState(secondSession)).toEqual({
      values: { reference: 'SUPPORT-2002' },
      completion: {},
    });
  });

  test.each(['accepted', 'rejected'])(
    'stores the allow-listed %s cookie preference as shared demo state',
    (preference) => {
      const session = {};

      demoSessionService.saveCookiePreference(session, preference);

      expect(demoSessionService.getCookiePreferenceState(session)).toEqual({
        preference,
        acknowledgementVisible: true,
      });
      expect(session.demo.cookiePreference).toBe(preference);
      expect(session.demo.cookieAcknowledgementVisible).toBe(true);
      expect(session.demo.support).toBeUndefined();
      expect(session.demo.casework).toBeUndefined();
    },
  );

  test('rejects unknown cookie preferences instead of storing request input', () => {
    const session = {};

    expect(() => demoSessionService.saveCookiePreference(session, 'maybe')).toThrow(
      'Cookie preference must be accepted or rejected',
    );
    expect(demoSessionService.getCookiePreferenceState(session)).toEqual({
      preference: null,
      acknowledgementVisible: false,
    });
    expect(session).toEqual({});
  });

  test('hides the acknowledgement without removing the cookie preference', () => {
    const session = {};

    demoSessionService.saveCookiePreference(session, 'accepted');
    demoSessionService.hideCookieAcknowledgement(session);

    expect(demoSessionService.getCookiePreferenceState(session)).toEqual({
      preference: 'accepted',
      acknowledgementVisible: false,
    });
  });

  test('resets support without changing casework, shared demo state or the legacy journey', () => {
    const legacyJourney = { answers: { fullName: 'Legacy User' }, complete: true };
    const casework = {
      values: { selectedTab: 'my-requests' },
      completion: { signedIn: true },
    };
    const session = {
      journey: legacyJourney,
      demo: {
        support: {
          values: { eligibility: 'eligible' },
          completion: { aboutYou: true },
        },
        casework,
        cookiePreference: 'accepted',
      },
    };

    demoSessionService.resetSupport(session);

    expect(session.demo.support).toEqual(emptyScenarioState());
    expect(session.demo.casework).toBe(casework);
    expect(session.demo.cookiePreference).toBe('accepted');
    expect(demoSessionService.getCookiePreferenceState(session).preference).toBe('accepted');
    expect(session.journey).toBe(legacyJourney);
  });

  test('resets casework without changing support, shared demo state or the legacy journey', () => {
    const legacyJourney = { answers: { receiveUpdates: 'yes' }, complete: false };
    const support = {
      values: { eligibility: 'eligible' },
      completion: { aboutYou: true },
    };
    const session = {
      journey: legacyJourney,
      demo: {
        support,
        casework: {
          values: { selectedTab: 'completed' },
          completion: { signedIn: true },
        },
        cookiePreference: 'rejected',
      },
    };

    demoSessionService.resetCasework(session);

    expect(session.demo.casework).toEqual(emptyScenarioState());
    expect(session.demo.support).toBe(support);
    expect(session.demo.cookiePreference).toBe('rejected');
    expect(demoSessionService.getCookiePreferenceState(session).preference).toBe('rejected');
    expect(session.journey).toBe(legacyJourney);
  });

  test('exposes namespaced demo helpers through the journey service without changing legacy state', () => {
    const legacyJourney = { answers: { hasFarmingBusiness: 'no' }, complete: true };
    const session = { journey: legacyJourney };

    journeyService.saveDemoSupportValue(session, 'eligibility', 'eligible');
    journeyService.saveDemoSupportCompletion(session, 'aboutYou', true);
    journeyService.saveDemoCaseworkValue(session, 'selectedTab', 'unassigned');
    journeyService.saveDemoCaseworkCompletion(session, 'signedIn', true);

    expect(journeyService.getDemoSupportState(session)).toEqual({
      values: { eligibility: 'eligible' },
      completion: { aboutYou: true },
    });
    expect(journeyService.getDemoCaseworkState(session)).toEqual({
      values: { selectedTab: 'unassigned' },
      completion: { signedIn: true },
    });
    expect(session.journey).toBe(legacyJourney);

    journeyService.resetDemoSupport(session);
    journeyService.resetDemoCasework(session);

    expect(journeyService.getDemoSupportState(session)).toEqual(emptyScenarioState());
    expect(journeyService.getDemoCaseworkState(session)).toEqual(emptyScenarioState());
    expect(session.journey).toBe(legacyJourney);

    journeyService.saveAnswer(session, 'receiveUpdates', 'yes');
    expect(session.journey).toEqual({
      answers: { hasFarmingBusiness: 'no', receiveUpdates: 'yes' },
      complete: false,
    });
  });
});
