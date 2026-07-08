const allowedValues = ['yes', 'no'];

function validateUpdates(value) {
  if (!allowedValues.includes(value)) {
    return {
      isValid: false,
      errors: {
        receiveUpdates: {
          text: 'Select whether you want to receive updates',
          href: '#receiveUpdates',
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

module.exports = { validateUpdates };
