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

function demoShellViewModel({ pageTitle, navigationSection } = {}) {
  return {
    pageTitle,
    pageTitleSuffix: 'Fictional support service demo',
    skipLink: {
      text: 'Skip to main content',
      href: '#main-content',
    },
    header: {
      homepageUrl: '/demo',
      productName: 'Component demo',
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
    footer: {},
  };
}

module.exports = { demoShellViewModel };
