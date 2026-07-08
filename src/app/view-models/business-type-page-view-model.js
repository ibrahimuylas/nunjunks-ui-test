function businessTypePageViewModel({ answers = {}, errors = {} } = {}) {
  const errorList = Object.values(errors);

  return {
    pageTitle: errors.hasFarmingBusiness
      ? 'Error: Do you have a farming business?'
      : 'Do you have a farming business?',
    errorSummary: errorList.length
      ? {
          titleText: 'There is a problem',
          errorList,
        }
      : null,
    radios: {
      idPrefix: 'hasFarmingBusiness',
      name: 'hasFarmingBusiness',
      fieldset: {
        legend: {
          text: 'Do you have a farming business?',
          classes: 'govuk-fieldset__legend--l',
          isPageHeading: true,
        },
      },
      hint: {
        text: 'This decides which questions you need to answer.',
      },
      errorMessage: errors.hasFarmingBusiness ? { text: errors.hasFarmingBusiness.text } : null,
      items: [
        {
          value: 'yes',
          text: 'Yes',
          checked: answers.hasFarmingBusiness === 'yes',
        },
        {
          value: 'no',
          text: 'No',
          checked: answers.hasFarmingBusiness === 'no',
        },
      ],
    },
  };
}

module.exports = { businessTypePageViewModel };
