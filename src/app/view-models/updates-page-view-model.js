function updatesPageViewModel({ answers = {}, errors = {}, backLinkHref = '/business-type' } = {}) {
  const errorList = Object.values(errors);

  return {
    pageTitle: errors.receiveUpdates
      ? 'Error: Do you want to receive updates?'
      : 'Do you want to receive updates?',
    errorSummary: errorList.length
      ? {
          titleText: 'There is a problem',
          errorList,
        }
      : null,
    radios: {
      idPrefix: 'receiveUpdates',
      name: 'receiveUpdates',
      fieldset: {
        legend: {
          text: 'Do you want to receive updates?',
          classes: 'govuk-fieldset__legend--l',
          isPageHeading: true,
        },
      },
      hint: {
        text: 'We can send occasional updates about this service.',
      },
      errorMessage: errors.receiveUpdates ? { text: errors.receiveUpdates.text } : null,
      items: [
        {
          value: 'yes',
          text: 'Yes',
          checked: answers.receiveUpdates === 'yes',
        },
        {
          value: 'no',
          text: 'No',
          checked: answers.receiveUpdates === 'no',
        },
      ],
    },
    backLinkHref,
  };
}

module.exports = { updatesPageViewModel };
