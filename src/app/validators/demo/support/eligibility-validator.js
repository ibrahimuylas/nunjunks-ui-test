const journeySteps = require('../../../config/journey-steps');

function normalizeEligibility(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateEligibility(value) {
  const normalizedValue = normalizeEligibility(value);

  if (!journeySteps.isDemoSupportEligibility(normalizedValue)) {
    return {
      isValid: false,
      errors: {
        eligibility: {
          text: 'Select whether the fictional request is eligible to continue',
          href: '#eligibility',
        },
      },
    };
  }

  return {
    isValid: true,
    value: normalizedValue,
    errors: {},
  };
}

module.exports = { normalizeEligibility, validateEligibility };
