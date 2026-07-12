const demoSupportPaths = Object.freeze({
  start: '/demo/support/start',
  eligibility: '/demo/support/eligibility',
  ineligible: '/demo/support/ineligible',
  taskList: '/demo/support/tasks',
  aboutYou: '/demo/support/about-you',
  supportNeeds: '/demo/support/support-needs',
  evidence: '/demo/support/evidence',
  checkAnswers: '/demo/support/check-answers',
});

const demoSupportEligibilityBranches = Object.freeze({
  eligible: demoSupportPaths.taskList,
  ineligible: demoSupportPaths.ineligible,
});

const demoSupportChangePaths = Object.freeze({
  eligibility: '/demo/support/eligibility/change',
  aboutYou: '/demo/support/about-you/change',
  supportNeeds: '/demo/support/support-needs/change',
  evidence: '/demo/support/evidence/change',
});

const demoSupportTaskStatuses = Object.freeze({
  notStarted: 'not-started',
  inProgress: 'in-progress',
  completed: 'completed',
  cannotStartYet: 'cannot-start-yet',
});

const demoSupportTaskSteps = Object.freeze(
  [
    {
      key: 'aboutYou',
      title: 'About you',
      hint: 'Enter fictional personal details',
      path: demoSupportPaths.aboutYou,
      required: true,
    },
    {
      key: 'supportNeeds',
      title: 'Support needs',
      hint: 'Describe the fictional help needed',
      path: demoSupportPaths.supportNeeds,
      required: true,
    },
    {
      key: 'evidence',
      title: 'Evidence',
      hint: 'Choose whether to add a fictional supporting document',
      path: demoSupportPaths.evidence,
      required: true,
    },
    {
      key: 'checkAnswers',
      title: 'Check your answers',
      path: demoSupportPaths.checkAnswers,
      required: false,
    },
  ].map(Object.freeze),
);

const guardedStepKeys = new Set(['taskList', ...demoSupportTaskSteps.map((step) => step.key)]);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getStateCollection(state, collection) {
  return isRecord(state) && isRecord(state[collection]) ? state[collection] : {};
}

function isDemoSupportEligibility(value) {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(demoSupportEligibilityBranches, value)
  );
}

function isDemoSupportTaskKey(stepKey) {
  return demoSupportTaskSteps.some((step) => step.key === stepKey);
}

function getDemoSupportPath(stepKey) {
  return Object.prototype.hasOwnProperty.call(demoSupportPaths, stepKey)
    ? demoSupportPaths[stepKey]
    : null;
}

function getDemoSupportChangePath(stepKey) {
  return Object.prototype.hasOwnProperty.call(demoSupportChangePaths, stepKey)
    ? demoSupportChangePaths[stepKey]
    : null;
}

function getDemoSupportNextPath(stepKey, values = {}) {
  if (stepKey === 'eligibility') {
    return isDemoSupportEligibility(values.eligibility)
      ? demoSupportEligibilityBranches[values.eligibility]
      : demoSupportPaths.eligibility;
  }

  return demoSupportPaths.start;
}

function getFirstIncompleteRequiredPath(state = {}) {
  const completion = getStateCollection(state, 'completion');
  const firstIncompleteStep = demoSupportTaskSteps.find(
    (step) => step.required && completion[step.key] !== true,
  );

  return firstIncompleteStep ? firstIncompleteStep.path : null;
}

function getTaskStatus(step, state) {
  if (step.key === 'checkAnswers' && getFirstIncompleteRequiredPath(state)) {
    return demoSupportTaskStatuses.cannotStartYet;
  }

  const completion = getStateCollection(state, 'completion');

  if (completion[step.key] === true) {
    return demoSupportTaskStatuses.completed;
  }

  if (completion[step.key] === false) {
    return demoSupportTaskStatuses.inProgress;
  }

  return demoSupportTaskStatuses.notStarted;
}

function getDemoSupportTaskStates(state = {}) {
  return demoSupportTaskSteps.map((step) => {
    const status = getTaskStatus(step, state);

    return {
      key: step.key,
      title: step.title,
      hint: step.hint,
      path: step.path,
      status,
      available: status !== demoSupportTaskStatuses.cannotStartYet,
    };
  });
}

function getDemoSupportAccessRedirect(stepKey, state = {}) {
  if (!guardedStepKeys.has(stepKey)) {
    return demoSupportPaths.start;
  }

  const values = getStateCollection(state, 'values');

  if (values.eligibility !== 'eligible') {
    return values.eligibility === 'ineligible'
      ? demoSupportPaths.ineligible
      : demoSupportPaths.eligibility;
  }

  if (stepKey === 'checkAnswers') {
    return getFirstIncompleteRequiredPath(state);
  }

  return null;
}

module.exports = {
  demoSupportChangePaths,
  demoSupportPaths,
  demoSupportTaskStatuses,
  getDemoSupportAccessRedirect,
  getDemoSupportChangePath,
  getDemoSupportNextPath,
  getDemoSupportPath,
  getDemoSupportTaskStates,
  getFirstIncompleteRequiredPath,
  isDemoSupportEligibility,
  isDemoSupportTaskKey,
};
