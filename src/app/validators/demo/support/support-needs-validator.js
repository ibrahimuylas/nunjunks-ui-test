const {
  demoSupportDescriptionCharacterLimit,
  demoSupportTypes,
  isDemoSupportType,
} = require('../../../config/demo-support-types');

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeSubmittedSupportTypes(value) {
  if (typeof value === 'string') {
    return { values: [value.trim()].filter(Boolean), hasInvalidType: false };
  }

  if (!Array.isArray(value)) {
    return { values: [], hasInvalidType: value !== undefined };
  }

  const hasInvalidType = value.some((entry) => typeof entry !== 'string');
  const values = value
    .filter((entry) => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);

  return { values, hasInvalidType };
}

function normalizeSupportTypes(value) {
  const submitted = normalizeSubmittedSupportTypes(value);
  const selectedValues = new Set(submitted.values);

  return {
    values: demoSupportTypes
      .map((supportType) => supportType.value)
      .filter((supportType) => selectedValues.has(supportType)),
    hasUnknownValue:
      submitted.hasInvalidType || submitted.values.some((entry) => !isDemoSupportType(entry)),
    hasSubmittedValue: submitted.values.length > 0 || submitted.hasInvalidType,
  };
}

function validateSupportNeeds(body = {}) {
  const normalizedSupportTypes = normalizeSupportTypes(body.supportTypes);
  const description = normalizeText(body.description);
  const additionalInformation = normalizeText(body.additionalInformation);
  const errors = {};

  if (!normalizedSupportTypes.hasSubmittedValue) {
    errors.supportTypes = {
      text: 'Select at least one type of fictional support',
      href: '#supportTypes',
    };
  } else if (normalizedSupportTypes.hasUnknownValue) {
    errors.supportTypes = {
      text: 'Select fictional support types from the list',
      href: '#supportTypes',
    };
  }

  if (!description) {
    errors.description = {
      text: 'Describe the fictional support needed',
      href: '#description',
    };
  } else if (description.length > demoSupportDescriptionCharacterLimit) {
    errors.description = {
      text: `Description must be ${demoSupportDescriptionCharacterLimit} characters or fewer`,
      href: '#description',
    };
  }

  return {
    isValid: Object.keys(errors).length === 0,
    value: {
      supportTypes: normalizedSupportTypes.values,
      description,
      additionalInformation,
    },
    errors,
  };
}

module.exports = {
  normalizeSupportTypes,
  validateSupportNeeds,
};
