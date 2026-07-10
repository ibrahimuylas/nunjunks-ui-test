const {
  normalizeEligibility,
  validateEligibility,
} = require('../../src/app/validators/demo/support/eligibility-validator');

describe('demo support eligibility validator', () => {
  test.each(['eligible', 'ineligible'])('accepts the allow-listed %s branch', (value) => {
    expect(validateEligibility(value)).toEqual({
      isValid: true,
      value,
      errors: {},
    });
  });

  test('normalizes surrounding whitespace before checking the allow-list', () => {
    expect(normalizeEligibility('  eligible  ')).toBe('eligible');
    expect(validateEligibility('  eligible  ').value).toBe('eligible');
  });

  test.each([undefined, null, '', ' ', 'unknown', ['eligible'], { value: 'eligible' }])(
    'rejects missing or unknown value %p with a linked error',
    (value) => {
      expect(validateEligibility(value)).toEqual({
        isValid: false,
        errors: {
          eligibility: {
            text: 'Select whether the fictional request is eligible to continue',
            href: '#eligibility',
          },
        },
      });
    },
  );
});
