const journeySteps = require('../config/journey-steps');
const demoSessionService = require('./demo-session-service');

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
  demoSessionService.saveSupportValue(session, 'aboutYou', aboutYou);
  markStepCompleted(session, 'aboutYou');
}

function completeSupportNeeds(session, supportNeeds) {
  demoSessionService.saveSupportValue(session, 'supportNeeds', supportNeeds);
  markStepCompleted(session, 'supportNeeds');
}

function completeEvidence(session, evidence) {
  demoSessionService.saveSupportValue(session, 'evidence', evidence);
  markStepCompleted(session, 'evidence');
}

module.exports = {
  completeAboutYou,
  completeEvidence,
  completeSupportNeeds,
  getAccessRedirect,
  getFirstIncompletePath,
  getNextPath,
  getState,
  getTaskStates,
  markStepCompleted,
  markStepVisited,
  saveEligibility,
};
