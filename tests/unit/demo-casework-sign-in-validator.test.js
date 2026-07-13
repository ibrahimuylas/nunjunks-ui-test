const {
  normalizeDemonstrationPassword,
  validateSignIn,
} = require('../../src/app/validators/demo/casework/sign-in-validator');

describe('demo casework sign-in validator', () => {
  test('normalizes and accepts any non-empty demonstration value', () => {
    expect(normalizeDemonstrationPassword('  made-up access value  ')).toBe(
      'made-up access value',
    );
    expect(validateSignIn('  made-up access value  ')).toEqual({
      isValid: true,
      value: 'made-up access value',
      errors: {},
    });
  });

  test.each([undefined, null, '', '   ', ['made-up'], { password: 'made-up' }])(
    'rejects missing or non-text value %p with a linked error',
    (value) => {
      expect(validateSignIn(value)).toEqual({
        isValid: false,
        errors: {
          password: {
            text: 'Enter a demonstration password',
            href: '#password',
          },
        },
      });
    },
  );
});
