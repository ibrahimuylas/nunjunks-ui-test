const DEMO_SESSION_KEY = 'demo';
const SUPPORT_SCENARIO = 'support';
const CASEWORK_SCENARIO = 'casework';
const COOKIE_PREFERENCES = new Set(['accepted', 'rejected']);
const UNSAFE_ENTRY_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function createScenarioState() {
  return { values: {}, completion: {} };
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isPlainRecord(value) {
  if (!isRecord(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function cloneNormalizedValue(value) {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    if (Object.keys(value).length !== value.length) {
      throw new TypeError('Demo session entries must be normalized JSON values');
    }

    return value.map(cloneNormalizedValue);
  }

  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, cloneNormalizedValue(nestedValue)]),
    );
  }

  throw new TypeError('Demo session entries must be normalized JSON values');
}

function ensureDemoState(session) {
  if (!isRecord(session[DEMO_SESSION_KEY])) {
    session[DEMO_SESSION_KEY] = {};
  }

  return session[DEMO_SESSION_KEY];
}

function ensureScenarioState(session, scenario) {
  const demo = ensureDemoState(session);

  if (!isRecord(demo[scenario])) {
    demo[scenario] = createScenarioState();
  }

  if (!isRecord(demo[scenario].values)) {
    demo[scenario].values = {};
  }

  if (!isRecord(demo[scenario].completion)) {
    demo[scenario].completion = {};
  }

  return demo[scenario];
}

function getScenarioState(session, scenario) {
  const state = ensureScenarioState(session, scenario);

  return {
    values: cloneNormalizedValue(state.values),
    completion: cloneNormalizedValue(state.completion),
  };
}

function saveScenarioEntry(session, scenario, collection, key, value) {
  if (typeof key !== 'string' || key === '' || UNSAFE_ENTRY_KEYS.has(key)) {
    throw new TypeError('Demo session entry keys must be safe non-empty strings');
  }

  const state = ensureScenarioState(session, scenario);
  state[collection][key] = cloneNormalizedValue(value);
}

function resetScenario(session, scenario) {
  const demo = ensureDemoState(session);
  demo[scenario] = createScenarioState();
}

function getSupportState(session) {
  return getScenarioState(session, SUPPORT_SCENARIO);
}

function getCaseworkState(session) {
  return getScenarioState(session, CASEWORK_SCENARIO);
}

function saveSupportValue(session, key, value) {
  saveScenarioEntry(session, SUPPORT_SCENARIO, 'values', key, value);
}

function saveCaseworkValue(session, key, value) {
  saveScenarioEntry(session, CASEWORK_SCENARIO, 'values', key, value);
}

function saveSupportCompletion(session, key, value) {
  saveScenarioEntry(session, SUPPORT_SCENARIO, 'completion', key, value);
}

function saveCaseworkCompletion(session, key, value) {
  saveScenarioEntry(session, CASEWORK_SCENARIO, 'completion', key, value);
}

function resetSupport(session) {
  resetScenario(session, SUPPORT_SCENARIO);
}

function resetCasework(session) {
  resetScenario(session, CASEWORK_SCENARIO);
}

function getCookiePreferenceState(session) {
  const demo = isRecord(session[DEMO_SESSION_KEY]) ? session[DEMO_SESSION_KEY] : {};
  const preference = COOKIE_PREFERENCES.has(demo.cookiePreference) ? demo.cookiePreference : null;

  return {
    preference,
    acknowledgementVisible: preference !== null && demo.cookieAcknowledgementVisible === true,
  };
}

function saveCookiePreference(session, preference) {
  if (!COOKIE_PREFERENCES.has(preference)) {
    throw new TypeError('Cookie preference must be accepted or rejected');
  }

  const demo = ensureDemoState(session);
  demo.cookiePreference = preference;
  demo.cookieAcknowledgementVisible = true;
}

function hideCookieAcknowledgement(session) {
  const { preference } = getCookiePreferenceState(session);

  if (preference !== null) {
    ensureDemoState(session).cookieAcknowledgementVisible = false;
  }
}

module.exports = {
  getSupportState,
  getCaseworkState,
  saveSupportValue,
  saveCaseworkValue,
  saveSupportCompletion,
  saveCaseworkCompletion,
  resetSupport,
  resetCasework,
  getCookiePreferenceState,
  saveCookiePreference,
  hideCookieAcknowledgement,
};
