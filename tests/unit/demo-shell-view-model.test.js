const {
  demoShellViewModel,
  cookieBannerViewModel,
} = require('../../src/app/view-models/demo/shell-view-model');

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

describe('cookie banner view model', () => {
  test('prepares first-visit accept and reject actions', () => {
    const model = cookieBannerViewModel();

    expect(model.action).toBe('/demo/cookies');
    expect(model.returnTo).toBe('/demo');
    expect(model.options.messages[0]).toMatchObject({
      headingText: 'Cookies on this component demo',
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
    });
    expect(model.options.messages[0].text).toContain('no optional cookies are set');
  });

  test.each([
    ['accepted', 'You accepted optional cookies'],
    ['rejected', 'You rejected optional cookies'],
  ])('prepares the %s acknowledgement and a no-JavaScript hide action', (preference, text) => {
    const model = cookieBannerViewModel({ preference, acknowledgementVisible: true });

    expect(model.options.messages[0]).toMatchObject({
      role: 'alert',
      actions: [
        {
          text: 'Hide cookie message',
          type: 'submit',
          name: 'cookies',
          value: 'hide',
        },
      ],
    });
    expect(model.options.messages[0].text).toContain(text);
    expect(model.options.messages[0].text).toContain('No optional cookies were set');
  });

  test('does not render the banner after its acknowledgement is hidden', () => {
    expect(
      cookieBannerViewModel({ preference: 'accepted', acknowledgementVisible: false }),
    ).toBeNull();
  });

  test('preserves the validated current demo location for the banner form', () => {
    const model = cookieBannerViewModel({ returnTo: '/demo/support/start?source=cookies' });

    expect(model.returnTo).toBe('/demo/support/start?source=cookies');
  });
});
