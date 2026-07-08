const { validateBusinessDetails } = require('../../src/app/validators/business-details-validator');
const { validateBusinessType } = require('../../src/app/validators/business-type-validator');
const { validateDateOfBirth } = require('../../src/app/validators/date-of-birth-validator');
const { validateFullName } = require('../../src/app/validators/full-name-validator');
const { validateUpdates } = require('../../src/app/validators/updates-validator');

describe('validators', () => {
  test('business type is required', () => {
    expect(validateBusinessType(undefined).errors.hasFarmingBusiness.text).toBe(
      'Select whether you have a farming business',
    );
  });

  test('business type accepts yes and no', () => {
    expect(validateBusinessType('yes').isValid).toBe(true);
    expect(validateBusinessType('no').isValid).toBe(true);
  });

  test('business name is required', () => {
    expect(validateBusinessDetails('').errors.businessName.text).toBe('Enter the business name');
  });

  test('business name is trimmed', () => {
    expect(validateBusinessDetails('  Green Valley Farm  ')).toEqual({
      isValid: true,
      value: 'Green Valley Farm',
      errors: {},
    });
  });

  test('full name is required', () => {
    expect(validateFullName('')).toEqual({
      isValid: false,
      errors: {
        fullName: {
          text: 'Enter your full name',
          href: '#fullName',
        },
      },
    });
  });

  test('full name is trimmed', () => {
    expect(validateFullName('  Jane Doe  ')).toEqual({
      isValid: true,
      value: 'Jane Doe',
      errors: {},
    });
  });

  test('date of birth is required', () => {
    expect(validateDateOfBirth({}).errors.dateOfBirth.text).toBe('Enter your date of birth');
  });

  test('date of birth must be real', () => {
    expect(
      validateDateOfBirth({
        'dateOfBirth-day': '31',
        'dateOfBirth-month': '2',
        'dateOfBirth-year': '2000',
      }).errors.dateOfBirth.text,
    ).toBe('Enter a real date of birth');
  });

  test('date of birth returns structured and ISO values', () => {
    expect(
      validateDateOfBirth({
        'dateOfBirth-day': '7',
        'dateOfBirth-month': '9',
        'dateOfBirth-year': '1990',
      }),
    ).toEqual({
      isValid: true,
      value: {
        day: '7',
        month: '9',
        year: '1990',
        iso: '1990-09-07',
      },
      errors: {},
    });
  });

  test('updates answer is required', () => {
    expect(validateUpdates(undefined).errors.receiveUpdates.text).toBe(
      'Select whether you want to receive updates',
    );
  });

  test('updates answer accepts yes and no', () => {
    expect(validateUpdates('yes').isValid).toBe(true);
    expect(validateUpdates('no').isValid).toBe(true);
  });
});
