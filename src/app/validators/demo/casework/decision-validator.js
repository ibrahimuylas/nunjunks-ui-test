const demoCaseworkCaseNoteCharacterLimit = 1000;

const demoCaseworkDecisions = Object.freeze([
  Object.freeze({ value: 'priority', text: 'Priority', status: 'priority' }),
  Object.freeze({ value: 'standard', text: 'Standard', status: 'standard' }),
  Object.freeze({
    value: 'more-information-needed',
    text: 'More information needed',
    status: 'more-information-needed',
  }),
]);

const decisionStatusByValue = new Map(
  demoCaseworkDecisions.map(({ value, status }) => [value, status]),
);

function normalizeDecision(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCaseNote(value) {
  return typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : '';
}

function getDecisionStatus(value) {
  return decisionStatusByValue.get(value) ?? null;
}

function validateDecision(body = {}) {
  const submitted = body !== null && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const decision = normalizeDecision(submitted.decision);
  const caseNote = normalizeCaseNote(submitted.caseNote);
  const errors = {};

  if (!decision) {
    errors.decision = {
      text: 'Select a demonstration decision',
      href: '#decision',
    };
  } else if (!getDecisionStatus(decision)) {
    errors.decision = {
      text: 'Select a demonstration decision from the list',
      href: '#decision',
    };
  }

  if (caseNote.length > demoCaseworkCaseNoteCharacterLimit) {
    errors.caseNote = {
      text: `Case note must be ${demoCaseworkCaseNoteCharacterLimit} characters or fewer`,
      href: '#caseNote',
    };
  }

  return {
    isValid: Object.keys(errors).length === 0,
    value: { decision, caseNote },
    errors,
  };
}

module.exports = {
  demoCaseworkCaseNoteCharacterLimit,
  demoCaseworkDecisions,
  getDecisionStatus,
  normalizeCaseNote,
  normalizeDecision,
  validateDecision,
};
