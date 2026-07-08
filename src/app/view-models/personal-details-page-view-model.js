function personalDetailsPageViewModel({ answers = {}, errors = {} } = {}) {
  const errorList = Object.values(errors);
  const dateOfBirth = answers.dateOfBirth || {};

  return {
    pageTitle:
      errors.fullName || errors.dateOfBirth
        ? 'Error: What are your personal details?'
        : 'What are your personal details?',
    errorSummary: errorList.length
      ? {
          titleText: 'There is a problem',
          errorList,
        }
      : null,
    fullNameInput: {
      id: 'fullName',
      name: 'fullName',
      value: answers.fullName || '',
      label: {
        text: 'What is your full name?',
        classes: 'govuk-label--l',
        isPageHeading: true,
      },
      errorMessage: errors.fullName ? { text: errors.fullName.text } : null,
      autocomplete: 'name',
      attributes: {
        'data-module': 'app-name-preview',
      },
    },
    dateOfBirthInput: {
      id: 'dateOfBirth',
      namePrefix: 'dateOfBirth',
      fieldset: {
        legend: {
          text: 'What is your date of birth?',
          classes: 'govuk-fieldset__legend--m',
        },
      },
      hint: {
        text: 'For example, 27 3 1984',
      },
      errorMessage: errors.dateOfBirth ? { text: errors.dateOfBirth.text } : null,
      items: [
        {
          name: 'day',
          value: dateOfBirth.day || '',
          classes: 'govuk-input--width-2',
        },
        {
          name: 'month',
          value: dateOfBirth.month || '',
          classes: 'govuk-input--width-2',
        },
        {
          name: 'year',
          value: dateOfBirth.year || '',
          classes: 'govuk-input--width-4',
        },
      ],
    },
  };
}

module.exports = { personalDetailsPageViewModel };
