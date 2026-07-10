const { demoShellViewModel } = require('../shell-view-model');

const eligibilityQuestion = 'Can this fictional support request continue?';

function supportEligibilityPageViewModel({ eligibility = null, errors = {}, change = false } = {}) {
  const errorList = Object.values(errors);

  return {
    ...demoShellViewModel({
      pageTitle: errors.eligibility ? `Error: ${eligibilityQuestion}` : eligibilityQuestion,
      navigationSection: 'support',
    }),
    backLink: {
      text: 'Back',
      href: change ? '/demo/support/ineligible' : '/demo/support/start',
    },
    errorSummary: errorList.length
      ? {
          titleText: 'There is a problem',
          errorList,
        }
      : null,
    formAction: change ? '/demo/support/eligibility/change' : '/demo/support/eligibility',
    eligibilityRadios: {
      idPrefix: 'eligibility',
      name: 'eligibility',
      fieldset: {
        legend: {
          text: eligibilityQuestion,
          classes: 'govuk-fieldset__legend--l',
          isPageHeading: true,
        },
      },
      hint: {
        text: 'This answer only controls the demonstration. It is not an eligibility decision for a real service.',
      },
      errorMessage: errors.eligibility ? { text: errors.eligibility.text } : null,
      items: [
        {
          value: 'eligible',
          text: 'Yes, continue to the fictional application tasks',
          checked: eligibility === 'eligible',
        },
        {
          value: 'ineligible',
          text: 'No, show the fictional ineligible outcome',
          checked: eligibility === 'ineligible',
        },
      ],
    },
  };
}

function supportIneligiblePageViewModel() {
  return {
    ...demoShellViewModel({
      pageTitle: 'This fictional request cannot continue',
      navigationSection: 'support',
    }),
    changeAnswerLink: {
      text: 'Change the fictional eligibility answer',
      href: '/demo/support/eligibility/change',
    },
    demoHomeLink: {
      text: 'Return to demo home',
      href: '/demo',
    },
  };
}

module.exports = { supportEligibilityPageViewModel, supportIneligiblePageViewModel };
