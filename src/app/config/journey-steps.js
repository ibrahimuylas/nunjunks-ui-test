const businessBranchAnswers = [{ key: 'businessName', path: '/business-details' }];
const individualBranchAnswers = [
  { key: 'fullName', path: '/full-name' },
  { key: 'dateOfBirth', path: '/full-name' },
];
const demoSupportSteps = require('./demo-support-steps');

function hasFarmingBusiness(answers) {
  return answers.hasFarmingBusiness === 'yes';
}

function isIndividualApplicant(answers) {
  return answers.hasFarmingBusiness === 'no';
}

function getBranchAnswers(answers) {
  if (hasFarmingBusiness(answers)) {
    return businessBranchAnswers;
  }

  if (isIndividualApplicant(answers)) {
    return individualBranchAnswers;
  }

  return [];
}

function getRequiredAnswers(answers) {
  return [
    { key: 'hasFarmingBusiness', path: '/business-type' },
    ...getBranchAnswers(answers),
    { key: 'receiveUpdates', path: '/updates' },
  ];
}

function getNextPath(stepKey, answers) {
  if (stepKey === 'businessType') {
    return hasFarmingBusiness(answers) ? '/business-details' : '/full-name';
  }

  if (stepKey === 'businessDetails' || stepKey === 'personalDetails') {
    return '/updates';
  }

  if (stepKey === 'updates') {
    return '/check-answers';
  }

  return '/start';
}

function getPreviousPath(stepKey, answers) {
  if (stepKey === 'businessType') {
    return '/start';
  }

  if (stepKey === 'businessDetails' || stepKey === 'personalDetails') {
    return '/business-type';
  }

  if (stepKey === 'updates') {
    return hasFarmingBusiness(answers) ? '/business-details' : '/full-name';
  }

  if (stepKey === 'checkAnswers') {
    return '/updates';
  }

  return '/start';
}

function getRequiredAnswersBefore(stepKey, answers) {
  const requiredAnswers = getRequiredAnswers(answers);
  const stepFirstAnswerKey = {
    businessDetails: 'businessName',
    personalDetails: 'fullName',
    updates: 'receiveUpdates',
    checkAnswers: null,
  }[stepKey];

  if (!stepFirstAnswerKey) {
    return requiredAnswers;
  }

  const stepIndex = requiredAnswers.findIndex((answer) => answer.key === stepFirstAnswerKey);
  return stepIndex === -1 ? requiredAnswers : requiredAnswers.slice(0, stepIndex);
}

function isDemoSupportEligibility(value) {
  return demoSupportSteps.isDemoSupportEligibility(value);
}

function getDemoSupportNextPath(stepKey, values = {}) {
  return demoSupportSteps.getDemoSupportNextPath(stepKey, values);
}

function getDemoSupportTaskStates(state = {}) {
  return demoSupportSteps.getDemoSupportTaskStates(state);
}

function getDemoSupportAccessRedirect(stepKey, state = {}) {
  return demoSupportSteps.getDemoSupportAccessRedirect(stepKey, state);
}

function getDemoSupportFirstIncompletePath(state = {}) {
  return demoSupportSteps.getFirstIncompleteRequiredPath(state);
}

function isDemoSupportTaskKey(stepKey) {
  return demoSupportSteps.isDemoSupportTaskKey(stepKey);
}

function getDemoSupportChangePath(stepKey) {
  return demoSupportSteps.getDemoSupportChangePath(stepKey);
}

function getDemoSupportPath(stepKey) {
  return demoSupportSteps.getDemoSupportPath(stepKey);
}

module.exports = {
  getNextPath,
  getPreviousPath,
  getRequiredAnswers,
  getRequiredAnswersBefore,
  hasFarmingBusiness,
  isIndividualApplicant,
  getDemoSupportAccessRedirect,
  getDemoSupportChangePath,
  getDemoSupportFirstIncompletePath,
  getDemoSupportNextPath,
  getDemoSupportPath,
  getDemoSupportTaskStates,
  isDemoSupportEligibility,
  isDemoSupportTaskKey,
};
