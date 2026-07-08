function validateFullName(value) {
  const fullName = String(value || '').trim();

  if (!fullName) {
    return {
      isValid: false,
      errors: {
        fullName: {
          text: 'Enter your full name',
          href: '#fullName',
        },
      },
    };
  }

  return {
    isValid: true,
    value: fullName,
    errors: {},
  };
}

module.exports = { validateFullName };
