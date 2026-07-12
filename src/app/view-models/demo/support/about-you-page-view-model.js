const {
  demoSupportCountries,
  isDemoSupportCountry,
} = require('../../../config/demo-support-countries');
const { demoShellViewModel } = require('../shell-view-model');

function supportAboutYouPageViewModel({ values = {}, errors = {} } = {}) {
  const dateOfBirth = values.dateOfBirth || {};
  const errorList = Object.values(errors);

  return {
    ...demoShellViewModel({
      pageTitle: errorList.length ? 'Error: About you' : 'About you',
      navigationSection: 'support',
    }),
    backLink: {
      text: 'Back',
      href: '/demo/support/tasks',
    },
    heading: 'About you',
    errorSummary: errorList.length
      ? {
          titleText: 'There is a problem',
          errorList,
        }
      : null,
    formAction: '/demo/support/about-you',
    fullNameInput: {
      id: 'fullName',
      name: 'fullName',
      value: values.fullName || '',
      label: {
        text: 'Fictional full name',
        classes: 'govuk-label--m',
      },
      hint: {
        text: 'For example, Alex Example. Do not enter a real name.',
      },
      errorMessage: errors.fullName ? { text: errors.fullName.text } : null,
      autocomplete: 'off',
    },
    dateOfBirthInput: {
      id: 'dateOfBirth',
      namePrefix: 'dateOfBirth',
      fieldset: {
        legend: {
          text: 'Date of birth',
          classes: 'govuk-fieldset__legend--m',
        },
      },
      hint: {
        text: 'For example, 27 3 1990. Use a fictional date in the past.',
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
    countrySelect: {
      id: 'country',
      name: 'country',
      label: {
        text: 'Current country',
        classes: 'govuk-label--m',
      },
      hint: {
        text: 'Choose a fictional current country.',
      },
      errorMessage: errors.country ? { text: errors.country.text } : null,
      items: [
        {
          value: '',
          text: 'Select a country',
          selected: !isDemoSupportCountry(values.country),
        },
        ...demoSupportCountries.map((country) => ({
          ...country,
          selected: values.country === country.value,
        })),
      ],
    },
  };
}

module.exports = { supportAboutYouPageViewModel };
