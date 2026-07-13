const { demoShellViewModel } = require('../shell-view-model');

const heading = 'Sign in to the fictional casework queue';

function caseworkSignInPageViewModel({ errors = {} } = {}) {
  const errorList = Object.values(errors);

  return {
    ...demoShellViewModel({
      pageTitle: errorList.length ? `Error: ${heading}` : heading,
      navigationSection: 'casework',
    }),
    backLink: {
      text: 'Back',
      href: '/demo',
    },
    heading,
    errorSummary: errorList.length
      ? {
          titleText: 'There is a problem',
          errorList,
        }
      : null,
    passwordInput: {
      id: 'password',
      name: 'password',
      label: {
        text: 'Demonstration password',
        classes: 'govuk-label--m',
      },
      hint: {
        text: 'Enter any made-up value. Do not use a real password.',
      },
      errorMessage: errors.password ? { text: errors.password.text } : null,
      autocomplete: 'off',
    },
  };
}

module.exports = { caseworkSignInPageViewModel };
