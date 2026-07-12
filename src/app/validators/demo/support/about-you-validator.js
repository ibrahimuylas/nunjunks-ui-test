const { isDemoSupportCountry } = require('../../../config/demo-support-countries');

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeDateOfBirth(body = {}) {
  return {
    day: normalizeText(body['dateOfBirth-day']),
    month: normalizeText(body['dateOfBirth-month']),
    year: normalizeText(body['dateOfBirth-year']),
  };
}

function parseDateOfBirth(dateOfBirth) {
  if (
    !/^\d{1,2}$/.test(dateOfBirth.day) ||
    !/^\d{1,2}$/.test(dateOfBirth.month) ||
    !/^\d{4}$/.test(dateOfBirth.year)
  ) {
    return null;
  }

  const day = Number(dateOfBirth.day);
  const month = Number(dateOfBirth.month);
  const year = Number(dateOfBirth.year);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  const normalized = {
    day: String(day),
    month: String(month),
    year: String(year).padStart(4, '0'),
  };

  return {
    date,
    value: {
      ...normalized,
      iso: `${normalized.year}-${normalized.month.padStart(2, '0')}-${normalized.day.padStart(2, '0')}`,
    },
  };
}

function startOfUtcDay(value) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function validateAboutYou(body = {}, { today = new Date() } = {}) {
  const fullName = normalizeText(body.fullName);
  const submittedDateOfBirth = normalizeDateOfBirth(body);
  const parsedDateOfBirth = parseDateOfBirth(submittedDateOfBirth);
  const country = normalizeText(body.country);
  const errors = {};

  if (!fullName) {
    errors.fullName = {
      text: 'Enter a fictional full name',
      href: '#fullName',
    };
  }

  if (!submittedDateOfBirth.day || !submittedDateOfBirth.month || !submittedDateOfBirth.year) {
    errors.dateOfBirth = {
      text: 'Enter a date of birth',
      href: '#dateOfBirth-day',
    };
  } else if (!parsedDateOfBirth) {
    errors.dateOfBirth = {
      text: 'Enter a real date of birth',
      href: '#dateOfBirth-day',
    };
  } else if (parsedDateOfBirth.date >= startOfUtcDay(today)) {
    errors.dateOfBirth = {
      text: 'Date of birth must be in the past',
      href: '#dateOfBirth-day',
    };
  }

  if (!country) {
    errors.country = {
      text: 'Select a current country',
      href: '#country',
    };
  } else if (!isDemoSupportCountry(country)) {
    errors.country = {
      text: 'Select a country from the list',
      href: '#country',
    };
  }

  const value = {
    fullName,
    dateOfBirth: parsedDateOfBirth ? parsedDateOfBirth.value : submittedDateOfBirth,
    country,
  };

  return {
    isValid: Object.keys(errors).length === 0,
    value,
    errors,
  };
}

module.exports = { normalizeDateOfBirth, normalizeText, validateAboutYou };
