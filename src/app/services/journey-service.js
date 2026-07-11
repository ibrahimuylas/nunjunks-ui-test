const journeySteps = require('../config/journey-steps');
const demoSessionService = require('./demo-session-service');
const demoSupportService = require('./demo-support-service');

function ensureJourney(session) {
  if (!session.journey) {
    session.journey = { answers: {}, complete: false };
  }

  return session.journey;
}

function getAnswers(session) {
  return { ...ensureJourney(session).answers };
}

function saveAnswer(session, key, value) {
  const journey = ensureJourney(session);
  journey.answers[key] = value;
  journey.complete = false;
}

function removeAnswers(session, keys) {
  const journey = ensureJourney(session);

  keys.forEach((key) => {
    delete journey.answers[key];
  });

  journey.complete = false;
}

function saveBranchAnswer(session, value) {
  saveAnswer(session, 'hasFarmingBusiness', value);
  removeAnswers(session, ['businessName', 'fullName', 'dateOfBirth', 'receiveUpdates']);
}

function hasAnswer(session, key) {
  const answers = ensureJourney(session).answers;
  return answers[key] !== undefined && answers[key] !== '';
}

function firstMissingAnswerPath(session) {
  const missingAnswer = journeySteps
    .getRequiredAnswers(getAnswers(session))
    .find((answer) => !hasAnswer(session, answer.key));

  return missingAnswer ? missingAnswer.path : null;
}

function firstMissingPreviousAnswerPath(session, stepKey) {
  const missingAnswer = journeySteps
    .getRequiredAnswersBefore(stepKey, getAnswers(session))
    .find((answer) => !hasAnswer(session, answer.key));

  return missingAnswer ? missingAnswer.path : null;
}

function getNextPath(stepKey, session) {
  return journeySteps.getNextPath(stepKey, getAnswers(session));
}

function getPreviousPath(stepKey, session) {
  return journeySteps.getPreviousPath(stepKey, getAnswers(session));
}

function markComplete(session) {
  ensureJourney(session).complete = true;
}

function isComplete(session) {
  return Boolean(ensureJourney(session).complete);
}

function getDemoSupportState(session) {
  return demoSupportService.getState(session);
}

function getDemoCaseworkState(session) {
  return demoSessionService.getCaseworkState(session);
}

function saveDemoSupportValue(session, key, value) {
  if (key === 'eligibility') {
    return demoSupportService.saveEligibility(session, value);
  }

  demoSessionService.saveSupportValue(session, key, value);
}

function saveDemoSupportEligibility(session, eligibility) {
  return demoSupportService.saveEligibility(session, eligibility);
}

function getDemoSupportNextPath(stepKey, session) {
  return demoSupportService.getNextPath(stepKey, session);
}

function getDemoSupportTaskStates(session) {
  return demoSupportService.getTaskStates(session);
}

function getDemoSupportAccessRedirect(stepKey, session) {
  return demoSupportService.getAccessRedirect(stepKey, session);
}

function getDemoSupportFirstIncompletePath(session) {
  return demoSupportService.getFirstIncompletePath(session);
}

function markDemoSupportStepVisited(session, stepKey) {
  demoSupportService.markStepVisited(session, stepKey);
}

function markDemoSupportStepCompleted(session, stepKey) {
  demoSupportService.markStepCompleted(session, stepKey);
}

function saveDemoCaseworkValue(session, key, value) {
  demoSessionService.saveCaseworkValue(session, key, value);
}

function saveDemoSupportCompletion(session, key, value) {
  demoSessionService.saveSupportCompletion(session, key, value);
}

function saveDemoCaseworkCompletion(session, key, value) {
  demoSessionService.saveCaseworkCompletion(session, key, value);
}

function resetDemoSupport(session) {
  demoSessionService.resetSupport(session);
}

function resetDemoCasework(session) {
  demoSessionService.resetCasework(session);
}

module.exports = {
  getAnswers,
  saveAnswer,
  saveBranchAnswer,
  hasAnswer,
  firstMissingAnswerPath,
  firstMissingPreviousAnswerPath,
  getNextPath,
  getPreviousPath,
  markComplete,
  isComplete,
  getDemoSupportState,
  getDemoCaseworkState,
  saveDemoSupportValue,
  saveDemoSupportEligibility,
  getDemoSupportAccessRedirect,
  getDemoSupportFirstIncompletePath,
  getDemoSupportNextPath,
  getDemoSupportTaskStates,
  markDemoSupportStepCompleted,
  markDemoSupportStepVisited,
  saveDemoCaseworkValue,
  saveDemoSupportCompletion,
  saveDemoCaseworkCompletion,
  resetDemoSupport,
  resetDemoCasework,
};
