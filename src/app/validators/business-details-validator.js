function validateBusinessDetails(value) {
  const businessName = String(value || '').trim();

  if (!businessName) {
    return {
      isValid: false,
      errors: {
        businessName: {
          text: 'Enter the business name',
          href: '#businessName',
        },
      },
    };
  }

  return {
    isValid: true,
    value: businessName,
    errors: {},
  };
}

module.exports = { validateBusinessDetails };
