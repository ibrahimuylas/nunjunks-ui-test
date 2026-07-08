function normalisePart(value) {
  return String(value || '').trim();
}

function buildDateOfBirth({ day, month, year }) {
  return {
    day: normalisePart(day),
    month: normalisePart(month),
    year: normalisePart(year),
  };
}

function hasCompleteDate({ day, month, year }) {
  return day && month && year;
}

function isNumericDate({ day, month, year }) {
  return /^\d+$/.test(day) && /^\d+$/.test(month) && /^\d+$/.test(year);
}

function isRealDate(dateOfBirth) {
  const day = Number(dateOfBirth.day);
  const month = Number(dateOfBirth.month);
  const year = Number(dateOfBirth.year);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function toIsoDate({ day, month, year }) {
  return [
    year.padStart(4, '0'),
    month.padStart(2, '0'),
    day.padStart(2, '0'),
  ].join('-');
}

function validateDateOfBirth(body) {
  const dateOfBirth = buildDateOfBirth({
    day: body['dateOfBirth-day'],
    month: body['dateOfBirth-month'],
    year: body['dateOfBirth-year'],
  });

  if (!hasCompleteDate(dateOfBirth)) {
    return {
      isValid: false,
      errors: {
        dateOfBirth: {
          text: 'Enter your date of birth',
          href: '#dateOfBirth-day',
        },
      },
      value: dateOfBirth,
    };
  }

  if (!isNumericDate(dateOfBirth) || !isRealDate(dateOfBirth)) {
    return {
      isValid: false,
      errors: {
        dateOfBirth: {
          text: 'Enter a real date of birth',
          href: '#dateOfBirth-day',
        },
      },
      value: dateOfBirth,
    };
  }

  return {
    isValid: true,
    value: {
      ...dateOfBirth,
      iso: toIsoDate(dateOfBirth),
    },
    errors: {},
  };
}

module.exports = { validateDateOfBirth, toIsoDate };
