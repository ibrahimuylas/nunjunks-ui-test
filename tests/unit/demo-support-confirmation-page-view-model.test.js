const {
  supportConfirmationPageViewModel,
} = require('../../src/app/view-models/demo/support/confirmation-page-view-model');

describe('demo support confirmation page view model', () => {
  test('prepares a fictional panel, support navigation and demo-home route', () => {
    const viewModel = supportConfirmationPageViewModel({ reference: 'DEMO-A1B2C3D4' });

    expect(viewModel.pageTitle).toBe('Fictional request submitted');
    expect(viewModel.serviceNavigation.navigation.find((item) => item.active)?.text).toBe(
      'Public journey',
    );
    expect(viewModel.panel).toEqual({
      titleText: 'Fictional request submitted',
      text: 'Your fictional reference is DEMO-A1B2C3D4',
    });
    expect(viewModel.startAnotherFormAction).toBe('/demo/support/start-another');
    expect(viewModel.startAnotherButton).toEqual({
      text: 'Start another fictional request',
      classes: 'govuk-button--secondary',
    });
    expect(viewModel.demoHomeLink).toEqual({
      text: 'Return to demo home',
      href: '/demo',
    });
  });
});
