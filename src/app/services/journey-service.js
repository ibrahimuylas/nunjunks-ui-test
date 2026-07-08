const journeySteps = require('../config/journey-steps');

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
};
