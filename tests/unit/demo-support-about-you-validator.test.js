const {
  normalizeDateOfBirth,
  validateAboutYou,
} = require('../../src/app/validators/demo/support/about-you-validator');

const today = new Date('2026-07-12T12:00:00.000Z');

function validForm(overrides = {}) {
  return {
    fullName: 'Alex Example',
    'dateOfBirth-day': '7',
    'dateOfBirth-month': '9',
    'dateOfBirth-year': '1990',
    country: 'scotland',
    ...overrides,
  };
}

describe('demo support about-you validator', () => {
  test('reports every missing required value with a linked error', () => {
    expect(validateAboutYou({}, { today })).toEqual({
      isValid: false,
      value: {
        fullName: '',
        dateOfBirth: { day: '', month: '', year: '' },
        country: '',
      },
      errors: {
        fullName: {
          text: 'Enter a fictional full name',
          href: '#fullName',
        },
        dateOfBirth: {
          text: 'Enter a date of birth',
          href: '#dateOfBirth-day',
        },
        country: {
          text: 'Select a current country',
          href: '#country',
        },
      },
    });
  });

  test.each([
    ['non-numeric parts', { 'dateOfBirth-day': 'day' }],
    ['an impossible calendar date', { 'dateOfBirth-day': '31', 'dateOfBirth-month': '2' }],
    ['a short year', { 'dateOfBirth-year': '90' }],
  ])('rejects malformed date input containing %s', (description, overrides) => {
    const validation = validateAboutYou(validForm(overrides), { today });

    expect(validation.isValid).toBe(false);
    expect(validation.errors.dateOfBirth).toEqual({
      text: 'Enter a real date of birth',
      href: '#dateOfBirth-day',
    });
  });

  test.each([
    ['today', { day: '12', month: '7', year: '2026' }],
    ['a future date', { day: '13', month: '7', year: '2026' }],
  ])('rejects %s because a date of birth must be in the past', (description, date) => {
    const validation = validateAboutYou(
      validForm({
        'dateOfBirth-day': date.day,
        'dateOfBirth-month': date.month,
        'dateOfBirth-year': date.year,
      }),
      { today },
    );

    expect(validation.isValid).toBe(false);
    expect(validation.errors.dateOfBirth.text).toBe('Date of birth must be in the past');
    expect(validation.value.dateOfBirth.iso).toBe(
      `${date.year}-${date.month.padStart(2, '0')}-${date.day.padStart(2, '0')}`,
    );
  });

  test.each([
    ['unknown', 'Select a country from the list'],
    ['England', 'Select a country from the list'],
    [['england'], 'Select a current country'],
    [{ value: 'england' }, 'Select a current country'],
  ])('rejects non-allow-listed country value %p', (country, errorText) => {
    const validation = validateAboutYou(validForm({ country }), { today });

    expect(validation.isValid).toBe(false);
    expect(validation.errors.country).toEqual({
      text: errorText,
      href: '#country',
    });
  });

  test('normalizes permitted text, date and country values before storage', () => {
    expect(
      validateAboutYou(
        validForm({
          fullName: '  Alex Example  ',
          'dateOfBirth-day': ' 07 ',
          'dateOfBirth-month': ' 09 ',
          'dateOfBirth-year': ' 1990 ',
          country: ' scotland ',
        }),
        { today },
      ),
    ).toEqual({
      isValid: true,
      value: {
        fullName: 'Alex Example',
        dateOfBirth: {
          day: '7',
          month: '9',
          year: '1990',
          iso: '1990-09-07',
        },
        country: 'scotland',
      },
      errors: {},
    });
  });

  test('normalizes submitted date fields without coercing non-string input', () => {
    expect(
      normalizeDateOfBirth({
        'dateOfBirth-day': ['7'],
        'dateOfBirth-month': ' 9 ',
        'dateOfBirth-year': 1990,
      }),
    ).toEqual({ day: '', month: '9', year: '' });
  });
});
