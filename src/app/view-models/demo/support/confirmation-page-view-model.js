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
    demoHomeLink: {
      text: 'Return to demo home',
      href: '/demo',
    },
  };
}

module.exports = { supportConfirmationPageViewModel };
