function normalizeDemonstrationPassword(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateSignIn(value) {
  const normalizedValue = normalizeDemonstrationPassword(value);

  if (normalizedValue === '') {
    return {
      isValid: false,
      errors: {
        password: {
          text: 'Enter a demonstration password',
          href: '#password',
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

module.exports = { normalizeDemonstrationPassword, validateSignIn };
