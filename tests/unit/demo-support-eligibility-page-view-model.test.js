const {
  supportEligibilityPageViewModel,
  supportIneligiblePageViewModel,
} = require('../../src/app/view-models/demo/support/eligibility-page-view-model');

describe('demo support eligibility page view model', () => {
  test.each(['eligible', 'ineligible'])('retains the allow-listed %s selection', (eligibility) => {
    const model = supportEligibilityPageViewModel({ eligibility });

    expect(model.pageTitle).toBe('Can this fictional support request continue?');
    expect(model.backLink.href).toBe('/demo/support/start');
    expect(model.formAction).toBe('/demo/support/eligibility');
    expect(model.eligibilityRadios.fieldset.legend).toMatchObject({
      text: 'Can this fictional support request continue?',
      isPageHeading: true,
    });
    expect(model.eligibilityRadios.hint.text).toContain('not an eligibility decision');
    expect(model.eligibilityRadios.items.find((item) => item.value === eligibility).checked).toBe(
      true,
    );
    expect(model.serviceNavigation.navigation).toContainEqual(
      expect.objectContaining({ text: 'Public journey', active: true }),
    );
  });

  test('maps a linked validation error to the summary and radios', () => {
    const error = {
      text: 'Select whether the fictional request is eligible to continue',
      href: '#eligibility',
    };
    const model = supportEligibilityPageViewModel({
      eligibility: 'unknown',
      errors: { eligibility: error },
    });

    expect(model.pageTitle).toMatch(/^Error:/);
    expect(model.errorSummary).toEqual({
      titleText: 'There is a problem',
      errorList: [error],
    });
    expect(model.eligibilityRadios.errorMessage).toEqual({ text: error.text });
    expect(model.eligibilityRadios.items.every((item) => item.checked === false)).toBe(true);
  });

  test('prepares the dedicated ineligible change route without accepting a return URL', () => {
    const model = supportEligibilityPageViewModel({ eligibility: 'ineligible', change: true });

    expect(model.backLink.href).toBe('/demo/support/ineligible');
    expect(model.formAction).toBe('/demo/support/eligibility/change');
  });

  test('prepares the ineligible outcome navigation', () => {
    const model = supportIneligiblePageViewModel();

    expect(model.pageTitle).toBe('This fictional request cannot continue');
    expect(model.changeAnswerLink).toEqual({
      text: 'Change the fictional eligibility answer',
      href: '/demo/support/eligibility/change',
    });
    expect(model.demoHomeLink.href).toBe('/demo');
  });
});
