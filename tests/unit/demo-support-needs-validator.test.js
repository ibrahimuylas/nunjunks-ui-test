const { demoSupportDescriptionCharacterLimit } = require('../../src/app/config/demo-support-types');
const {
  normalizeSupportTypes,
  validateSupportNeeds,
} = require('../../src/app/validators/demo/support/support-needs-validator');

function validForm(overrides = {}) {
  return {
    supportTypes: ['safe-accommodation', 'essential-items'],
    description: 'A fictional household needs somewhere safe to stay tonight.',
    additionalInformation: '',
    ...overrides,
  };
}

describe('demo support-needs validator', () => {
  test('reports every missing required value with a linked error', () => {
    expect(validateSupportNeeds({})).toEqual({
      isValid: false,
      value: {
        supportTypes: [],
        description: '',
        additionalInformation: '',
      },
      errors: {
        supportTypes: {
          text: 'Select at least one type of fictional support',
          href: '#supportTypes',
        },
        description: {
          text: 'Describe the fictional support needed',
          href: '#description',
        },
      },
    });
  });

  test.each([
    ['an unknown string', 'unknown'],
    ['a mixed known and unknown list', ['safe-accommodation', 'unknown']],
    ['a non-string value', { value: 'safe-accommodation' }],
    ['a list containing a non-string value', ['safe-accommodation', 1]],
  ])('rejects %s without retaining an unapproved checkbox value', (description, supportTypes) => {
    const validation = validateSupportNeeds(validForm({ supportTypes }));

    expect(validation.isValid).toBe(false);
    expect(validation.errors.supportTypes).toEqual({
      text: 'Select fictional support types from the list',
      href: '#supportTypes',
    });
    expect(validation.value.supportTypes.every((value) => value !== 'unknown')).toBe(true);
  });

  test('normalizes, de-duplicates and orders allow-listed checkbox values', () => {
    expect(normalizeSupportTypes([' wellbeing ', 'safe-accommodation', 'wellbeing'])).toEqual({
      values: ['safe-accommodation', 'wellbeing'],
      hasUnknownValue: false,
      hasSubmittedValue: true,
    });
  });

  test.each([
    [demoSupportDescriptionCharacterLimit, true, undefined],
    [
      demoSupportDescriptionCharacterLimit + 1,
      false,
      `Description must be ${demoSupportDescriptionCharacterLimit} characters or fewer`,
    ],
  ])('validates a description containing %i characters', (length, isValid, errorText) => {
    const validation = validateSupportNeeds(validForm({ description: 'x'.repeat(length) }));

    expect(validation.isValid).toBe(isValid);
    expect(validation.value.description).toHaveLength(length);
    expect(validation.errors.description?.text).toBe(errorText);
  });

  test('normalizes a single checkbox and both text fields before storage', () => {
    expect(
      validateSupportNeeds(
        validForm({
          supportTypes: ' wellbeing ',
          description: '  A fictional request for wellbeing support.  ',
          additionalInformation: '  The fictional applicant can be contacted in the afternoon.  ',
        }),
      ),
    ).toEqual({
      isValid: true,
      value: {
        supportTypes: ['wellbeing'],
        description: 'A fictional request for wellbeing support.',
        additionalInformation: 'The fictional applicant can be contacted in the afternoon.',
      },
      errors: {},
    });
  });

  test('allows optional additional information to be omitted', () => {
    const validation = validateSupportNeeds(validForm({ additionalInformation: undefined }));

    expect(validation.isValid).toBe(true);
    expect(validation.value.additionalInformation).toBe('');
  });
});
