function businessDetailsPageViewModel({ answers = {}, errors = {} } = {}) {
  const errorList = Object.values(errors);

  return {
    pageTitle: errors.businessName
      ? 'Error: What is the business name?'
      : 'What is the business name?',
    errorSummary: errorList.length
      ? {
          titleText: 'There is a problem',
          errorList,
        }
      : null,
    input: {
      id: 'businessName',
      name: 'businessName',
      value: answers.businessName || '',
      label: {
        text: 'What is the business name?',
        classes: 'govuk-label--l',
        isPageHeading: true,
      },
      hint: {
        text: 'For example, Green Valley Farm',
      },
      errorMessage: errors.businessName ? { text: errors.businessName.text } : null,
    },
  };
}

module.exports = { businessDetailsPageViewModel };
