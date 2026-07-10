const {
  supportStartPageViewModel,
} = require('../../src/app/view-models/demo/support/start-page-view-model');

describe('demo support start page view model', () => {
  test('prepares the public shell, start destination and demo-home return path', () => {
    const model = supportStartPageViewModel();

    expect(model.pageTitle).toBe('Request emergency housing support');
    expect(model.startButton).toEqual({
      text: 'Start now',
      href: '/demo/support/eligibility',
      isStartButton: true,
    });
    expect(model.header.homepageUrl).toBe('/demo');
    expect(model.serviceNavigation.navigation).toContainEqual(
      expect.objectContaining({
        text: 'Demo home',
        href: '/demo',
      }),
    );
    expect(model.serviceNavigation.navigation).toContainEqual(
      expect.objectContaining({
        text: 'Public journey',
        href: '/demo/support/start',
        active: true,
      }),
    );
  });

  test('prepares all start and safety guidance components', () => {
    const model = supportStartPageViewModel();

    expect(model.supportTypesAccordion).toMatchObject({
      id: 'support-types',
      headingLevel: 3,
      rememberExpanded: false,
    });
    expect(model.supportTypesAccordion.items.map((item) => item.heading.text)).toEqual([
      'Temporary accommodation',
      'Support to stay safely at home',
      'Practical support',
    ]);
    expect(model.supportTypesAccordion.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          content: expect.objectContaining({
            text: expect.stringContaining('does not arrange accommodation'),
          }),
        }),
      ]),
    );
    expect(model.sessionInsetText.text).toContain('current session only');
    expect(model.sessionInsetText.text).toContain('external system');
    expect(model.safetyWarning).toEqual({
      text: 'If continuing could put you at risk, use Exit this page now and consider using a device you trust.',
      iconFallbackText: 'Warning',
    });
    expect(model.exitGuidanceDetails.summaryText).toBe('How Exit this page works');
    expect(model.exitGuidanceDetails.text).toContain('BBC Weather in this tab');
    expect(model.exitGuidanceDetails.text).toContain('browser history');
  });
});
