const {
  caseworkSignInPageViewModel,
} = require('../../src/app/view-models/demo/casework/sign-in-page-view-model');

describe('demo casework sign-in page view model', () => {
  test('prepares the fictional casework shell and password input without a retained value', () => {
    const model = caseworkSignInPageViewModel();

    expect(model.pageTitle).toBe('Sign in to the fictional casework queue');
    expect(model.heading).toBe('Sign in to the fictional casework queue');
    expect(model.backLink).toEqual({ text: 'Back', href: '/demo' });
    expect(model.passwordInput).toEqual({
      id: 'password',
      name: 'password',
      label: {
        text: 'Demonstration password',
        classes: 'govuk-label--m',
      },
      hint: {
        text: 'Enter any made-up value. Do not use a real password.',
      },
      errorMessage: null,
      autocomplete: 'off',
    });
    expect(model.passwordInput).not.toHaveProperty('value');
    expect(model.serviceNavigation.navigation).toContainEqual(
      expect.objectContaining({ text: 'Caseworker journey', active: true }),
    );
  });

  test('maps a linked error to the summary and password input', () => {
    const error = {
      text: 'Enter a demonstration password',
      href: '#password',
    };
    const model = caseworkSignInPageViewModel({ errors: { password: error } });

    expect(model.pageTitle).toBe('Error: Sign in to the fictional casework queue');
    expect(model.errorSummary).toEqual({
      titleText: 'There is a problem',
      errorList: [error],
    });
    expect(model.passwordInput.errorMessage).toEqual({ text: error.text });
    expect(model.passwordInput).not.toHaveProperty('value');
  });
});
