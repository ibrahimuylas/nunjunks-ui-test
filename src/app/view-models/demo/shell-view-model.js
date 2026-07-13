const navigationItems = [
  {
    section: 'home',
    text: 'Demo home',
    href: '/demo',
  },
  {
    section: 'support',
    text: 'Public journey',
    href: '/demo/support/start',
  },
  {
    section: 'casework',
    text: 'Caseworker journey',
    href: '/demo/casework/sign-in',
  },
];

const cookieAcknowledgements = {
  accepted: 'You accepted optional cookies for this demonstration. No optional cookies were set.',
  rejected: 'You rejected optional cookies for this demonstration. No optional cookies were set.',
};

const publicExitUrl = 'https://www.bbc.co.uk/weather';

function cookieBannerViewModel({
  preference = null,
  acknowledgementVisible = false,
  returnTo = '/demo',
} = {}) {
  if (preference === null) {
    return {
      action: '/demo/cookies',
      returnTo,
      options: {
        messages: [
          {
            headingText: 'Cookies on this component demo',
            text: 'We only use an essential session cookie. These buttons demonstrate accepting or rejecting optional cookies, but no optional cookies are set.',
            actions: [
              {
                text: 'Accept optional cookies',
                type: 'submit',
                name: 'cookies',
                value: 'accept',
              },
              {
                text: 'Reject optional cookies',
                type: 'submit',
                name: 'cookies',
                value: 'reject',
              },
            ],
          },
        ],
      },
    };
  }

  if (!acknowledgementVisible || !cookieAcknowledgements[preference]) {
    return null;
  }

  return {
    action: '/demo/cookies',
    returnTo,
    options: {
      messages: [
        {
          text: cookieAcknowledgements[preference],
          role: 'alert',
          actions: [
            {
              text: 'Hide cookie message',
              type: 'submit',
              name: 'cookies',
              value: 'hide',
            },
          ],
        },
      ],
    },
  };
}

function demoShellViewModel({ pageTitle, navigationSection } = {}) {
  const isPublicJourney = navigationSection === 'support';

  return {
    pageTitle,
    pageTitleSuffix: 'Fictional support service demo',
    skipLink: {
      text: 'Skip to main content',
      href: '#main-content',
    },
    header: {
      homepageUrl: '/demo',
      productName: 'Fictional component demo',
    },
    serviceNavigation: {
      serviceName: 'Fictional support service',
      serviceUrl: '/demo',
      navigation: navigationItems.map((item) => ({
        text: item.text,
        href: item.href,
        current: item.section === 'home' && navigationSection === 'home',
        active: item.section !== 'home' && item.section === navigationSection,
      })),
    },
    phaseBanner: {
      tag: {
        text: 'Prototype',
      },
      text: 'This is a fictional service for demonstrating GOV.UK components.',
    },
    exitThisPage: isPublicJourney
      ? {
          redirectUrl: publicExitUrl,
        }
      : null,
    exitThisPageSkipLink: isPublicJourney
      ? {
          text: 'Exit this page',
          href: publicExitUrl,
          classes: 'govuk-js-exit-this-page-skiplink',
          attributes: {
            rel: 'nofollow noreferrer',
          },
        }
      : null,
    footer: {},
  };
}

module.exports = { demoShellViewModel, cookieBannerViewModel };
