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

module.exports = { getState, saveEligibility, getNextPath };
