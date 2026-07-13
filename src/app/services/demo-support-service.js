const { randomBytes } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const journeySteps = require('../config/journey-steps');
const { validateAboutYou } = require('../validators/demo/support/about-you-validator');
const {
  evidenceFileTypes,
  validateEvidence,
} = require('../validators/demo/support/evidence-validator');
const { validateSupportNeeds } = require('../validators/demo/support/support-needs-validator');
const demoSessionService = require('./demo-session-service');

const fictionalReferencePattern = /^DEMO-[A-F0-9]{8}$/;

function getState(session) {
  return demoSessionService.getSupportState(session);
}

function saveEligibility(session, eligibility) {
  if (!journeySteps.isDemoSupportEligibility(eligibility)) {
    throw new TypeError('Demo support eligibility must be an allow-listed value');
  }

  const currentEligibility = getState(session).values.eligibility;
  const eligibilityChanged = currentEligibility !== undefined && currentEligibility !== eligibility;

  if (eligibilityChanged) {
    demoSessionService.resetSupport(session);
  }

  demoSessionService.saveSupportValue(session, 'eligibility', eligibility);
  return eligibilityChanged;
}

function getNextPath(stepKey, session) {
  return journeySteps.getDemoSupportNextPath(stepKey, getState(session).values);
}

function getTaskStates(session) {
  return journeySteps.getDemoSupportTaskStates(getState(session));
}

function getAccessRedirect(stepKey, session) {
  return journeySteps.getDemoSupportAccessRedirect(stepKey, getState(session));
}

function getFirstIncompletePath(session) {
  return journeySteps.getDemoSupportFirstIncompletePath(getState(session));
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasValidAboutYou(aboutYou) {
  if (!isRecord(aboutYou) || !isRecord(aboutYou.dateOfBirth)) {
    return false;
  }

  return validateAboutYou({
    fullName: aboutYou.fullName,
    'dateOfBirth-day': aboutYou.dateOfBirth.day,
    'dateOfBirth-month': aboutYou.dateOfBirth.month,
    'dateOfBirth-year': aboutYou.dateOfBirth.year,
    country: aboutYou.country,
  }).isValid;
}

function hasValidSupportNeeds(supportNeeds) {
  return isRecord(supportNeeds) && validateSupportNeeds(supportNeeds).isValid;
}

function hasValidEvidence(evidence) {
  if (!isRecord(evidence) || !Object.hasOwn(evidence, 'filename')) {
    return false;
  }

  if (evidence.filename === null) {
    return true;
  }

  if (typeof evidence.filename !== 'string') {
    return false;
  }

  const fileType = evidenceFileTypes.find(({ extension }) =>
    evidence.filename.toLowerCase().endsWith(extension),
  );

  if (!fileType) {
    return false;
  }

  const validation = validateEvidence({
    originalname: evidence.filename,
    mimetype: fileType.mimeType,
    size: 0,
  });

  return validation.isValid && validation.value.filename === evidence.filename;
}

function getSubmissionRedirect(session) {
  const accessRedirect = getAccessRedirect('checkAnswers', session);

  if (accessRedirect) {
    return accessRedirect;
  }

  const { values } = getState(session);
  const requiredSections = [
    ['aboutYou', hasValidAboutYou],
    ['supportNeeds', hasValidSupportNeeds],
    ['evidence', hasValidEvidence],
  ];
  const invalidSection = requiredSections.find(
    ([sectionKey, isValid]) => !isValid(values[sectionKey]),
  );

  return invalidSection ? journeySteps.getDemoSupportPath(invalidSection[0]) : null;
}

function isFictionalReference(value) {
  return typeof value === 'string' && fictionalReferencePattern.test(value);
}

function createFictionalReference() {
  return `DEMO-${randomBytes(4).toString('hex').toUpperCase()}`;
}

function submitRequest(session) {
  const redirectPath = getSubmissionRedirect(session);

  if (redirectPath) {
    return { submitted: false, replayed: false, reference: null, redirectPath };
  }

  const state = getState(session);

  if (state.completion.submitted === true && isFictionalReference(state.values.reference)) {
    return {
      submitted: true,
      replayed: true,
      reference: state.values.reference,
      redirectPath: null,
    };
  }

  const reference = createFictionalReference();
  demoSessionService.saveSupportValue(session, 'reference', reference);
  demoSessionService.saveSupportCompletion(session, 'checkAnswers', true);
  demoSessionService.saveSupportCompletion(session, 'submitted', true);

  return { submitted: true, replayed: false, reference, redirectPath: null };
}

function getConfirmationAccessRedirect(session) {
  const submissionRedirect = getSubmissionRedirect(session);

  if (submissionRedirect) {
    return submissionRedirect;
  }

  const state = getState(session);

  return state.completion.submitted === true && isFictionalReference(state.values.reference)
    ? null
    : journeySteps.getDemoSupportPath('checkAnswers');
}

function invalidateSubmissionWhenChanged(session, key, value) {
  const state = getState(session);

  if (state.completion.submitted === true && !isDeepStrictEqual(state.values[key], value)) {
    demoSessionService.saveSupportValue(session, 'reference', null);
    demoSessionService.saveSupportCompletion(session, 'checkAnswers', false);
    demoSessionService.saveSupportCompletion(session, 'submitted', false);
  }
}

function assertChangeStepKey(stepKey) {
  if (!journeySteps.getDemoSupportChangePath(stepKey)) {
    throw new TypeError('Demo support change step key must be allow-listed');
  }
}

function getChangePath(stepKey) {
  assertChangeStepKey(stepKey);
  return journeySteps.getDemoSupportChangePath(stepKey);
}

function getChangeAccessRedirect(stepKey, session) {
  assertChangeStepKey(stepKey);

  if (stepKey === 'eligibility') {
    return journeySteps.isDemoSupportEligibility(getState(session).values.eligibility)
      ? null
      : journeySteps.getDemoSupportPath('eligibility');
  }

  return getAccessRedirect('checkAnswers', session);
}

function getChangeReturnPath(stepKey, session) {
  assertChangeStepKey(stepKey);
  const accessRedirect = getChangeAccessRedirect(stepKey, session);

  if (accessRedirect) {
    return accessRedirect;
  }

  if (stepKey !== 'eligibility') {
    return journeySteps.getDemoSupportPath('checkAnswers');
  }

  const { eligibility } = getState(session).values;

  if (eligibility === 'ineligible') {
    return getNextPath('eligibility', session);
  }

  return getFirstIncompletePath(session) || journeySteps.getDemoSupportPath('checkAnswers');
}

function assertTaskKey(stepKey) {
  if (!journeySteps.isDemoSupportTaskKey(stepKey)) {
    throw new TypeError('Demo support task key must be allow-listed');
  }
}

function markStepVisited(session, stepKey) {
  assertTaskKey(stepKey);

  if (getState(session).completion[stepKey] !== true) {
    demoSessionService.saveSupportCompletion(session, stepKey, false);
  }
}

function markStepCompleted(session, stepKey) {
  assertTaskKey(stepKey);
  demoSessionService.saveSupportCompletion(session, stepKey, true);
}

function completeAboutYou(session, aboutYou) {
  invalidateSubmissionWhenChanged(session, 'aboutYou', aboutYou);
  demoSessionService.saveSupportValue(session, 'aboutYou', aboutYou);
  markStepCompleted(session, 'aboutYou');
}

function completeSupportNeeds(session, supportNeeds) {
  invalidateSubmissionWhenChanged(session, 'supportNeeds', supportNeeds);
  demoSessionService.saveSupportValue(session, 'supportNeeds', supportNeeds);
  markStepCompleted(session, 'supportNeeds');
}

function completeEvidence(session, evidence) {
  invalidateSubmissionWhenChanged(session, 'evidence', evidence);
  demoSessionService.saveSupportValue(session, 'evidence', evidence);
  markStepCompleted(session, 'evidence');
}

module.exports = {
  completeAboutYou,
  completeEvidence,
  completeSupportNeeds,
  getAccessRedirect,
  getChangeAccessRedirect,
  getChangePath,
  getChangeReturnPath,
  getConfirmationAccessRedirect,
  getFirstIncompletePath,
  getNextPath,
  getState,
  getSubmissionRedirect,
  getTaskStates,
  markStepCompleted,
  markStepVisited,
  saveEligibility,
  submitRequest,
};
