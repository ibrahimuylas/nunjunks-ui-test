const { demoShellViewModel } = require('../shell-view-model');

function supportConfirmationPageViewModel({ reference }) {
  return {
    ...demoShellViewModel({
      pageTitle: 'Fictional request submitted',
      navigationSection: 'support',
    }),
    panel: {
      titleText: 'Fictional request submitted',
      text: `Your fictional reference is ${reference}`,
    },
    startAnotherFormAction: '/demo/support/start-another',
    startAnotherButton: {
      text: 'Start another fictional request',
      classes: 'govuk-button--secondary',
    },
    demoHomeLink: {
      text: 'Return to demo home',
      href: '/demo',
    },
  };
}

module.exports = { supportConfirmationPageViewModel };
