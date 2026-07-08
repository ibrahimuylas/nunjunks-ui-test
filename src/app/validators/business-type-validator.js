const allowedValues = ['yes', 'no'];

function validateBusinessType(value) {
  if (!allowedValues.includes(value)) {
    return {
      isValid: false,
      errors: {
        hasFarmingBusiness: {
          text: 'Select whether you have a farming business',
          href: '#hasFarmingBusiness',
        },
      },
    };
  }

  return {
    isValid: true,
    value,
    errors: {},
  };
}

module.exports = { validateBusinessType };
