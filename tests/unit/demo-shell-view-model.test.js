const { demoShellViewModel } = require('../../src/app/view-models/demo/shell-view-model');

describe('demo shell view model', () => {
  test('prepares the shared component options and current navigation item', () => {
    const model = demoShellViewModel({
      pageTitle: 'Example page',
      navigationSection: 'support',
    });

    expect(model.header.homepageUrl).toBe('/demo');
    expect(model.skipLink.href).toBe('#main-content');
    expect(model.phaseBanner.tag.text).toBe('Prototype');
    expect(model.footer).toEqual({});
    expect(model.serviceNavigation.navigation).toEqual([
      {
        text: 'Demo home',
        href: '/demo',
        current: false,
        active: false,
      },
      {
        text: 'Public journey',
        href: '/demo/support/start',
        current: false,
        active: true,
      },
      {
        text: 'Caseworker journey',
        href: '/demo/casework/sign-in',
        current: false,
        active: false,
      },
    ]);
  });
});
