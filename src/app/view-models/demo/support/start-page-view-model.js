const { demoShellViewModel } = require('../shell-view-model');

function supportStartPageViewModel() {
  return {
    ...demoShellViewModel({
      pageTitle: 'Request emergency housing support',
      navigationSection: 'support',
    }),
    supportTypesAccordion: {
      id: 'support-types',
      headingLevel: 3,
      rememberExpanded: false,
      items: [
        {
          heading: {
            text: 'Temporary accommodation',
          },
          summary: {
            text: 'A short-term fictional place to stay',
          },
          content: {
            text: 'The demo shows how someone could describe needing somewhere safe to stay. It does not arrange accommodation.',
          },
        },
        {
          heading: {
            text: 'Support to stay safely at home',
          },
          summary: {
            text: 'Fictional help with immediate housing safety',
          },
          content: {
            text: 'The demo shows how someone could ask for changes or practical help to make their current housing safer.',
          },
        },
        {
          heading: {
            text: 'Practical support',
          },
          summary: {
            text: 'Fictional help with essential needs',
          },
          content: {
            text: 'The demo includes examples such as travel, food and contacting other fictional support services.',
          },
        },
      ],
    },
    sessionInsetText: {
      text: 'This demo keeps made-up answers in your current session only. It does not send them to a housing service or any external system.',
    },
    safetyWarning: {
      text: 'If continuing could put you at risk, use Exit this page now and consider using a device you trust.',
      iconFallbackText: 'Warning',
    },
    exitGuidanceDetails: {
      summaryText: 'How Exit this page works',
      text: 'The action opens BBC Weather in this tab. You can also press Shift 3 times or use the keyboard Exit this page link. It does not remove this service from your browser history or clear made-up answers already stored in this demo session.',
    },
    startButton: {
      text: 'Start now',
      href: '/demo/support/eligibility',
      isStartButton: true,
    },
  };
}

module.exports = { supportStartPageViewModel };
