const {
  supportAboutYouPageViewModel,
} = require('../../src/app/view-models/demo/support/about-you-page-view-model');

describe('demo support about-you page view model', () => {
  test('prepares visible labels, useful fictional-data hints and navigation', () => {
    const model = supportAboutYouPageViewModel();

    expect(model.pageTitle).toBe('About you');
    expect(model.heading).toBe('About you');
    expect(model.backLink).toEqual({ text: 'Back', href: '/demo/support/tasks' });
    expect(model.formAction).toBe('/demo/support/about-you');
    expect(model.fullNameInput).toMatchObject({
      id: 'fullName',
      name: 'fullName',
      value: '',
      label: { text: 'Fictional full name' },
      hint: { text: expect.stringContaining('Do not enter a real name') },
      autocomplete: 'off',
    });
    expect(model.dateOfBirthInput.fieldset.legend.text).toBe('Date of birth');
    expect(model.dateOfBirthInput.hint.text).toContain('fictional date in the past');
    expect(model.countrySelect.label.text).toBe('Current country');
    expect(model.countrySelect.hint.text).toContain('fictional current country');
    expect(model.countrySelect.items.map(({ value }) => value)).toEqual([
      '',
      'england',
      'northern-ireland',
      'scotland',
      'wales',
    ]);
    expect(model.countrySelect.items[0].selected).toBe(true);
    expect(model.serviceNavigation.navigation).toContainEqual(
      expect.objectContaining({ text: 'Public journey', active: true }),
    );
  });

  test('retains every submitted field and maps linked errors to GOV.UK options', () => {
    const errors = {
      fullName: { text: 'Enter a fictional full name', href: '#fullName' },
      dateOfBirth: { text: 'Enter a real date of birth', href: '#dateOfBirth-day' },
      country: { text: 'Select a current country', href: '#country' },
    };
    const model = supportAboutYouPageViewModel({
      values: {
        fullName: 'Alex Example',
        dateOfBirth: { day: '31', month: '2', year: '1990' },
        country: 'scotland',
      },
      errors,
    });

    expect(model.pageTitle).toBe('Error: About you');
    expect(model.errorSummary).toEqual({
      titleText: 'There is a problem',
      errorList: Object.values(errors),
    });
    expect(model.fullNameInput.value).toBe('Alex Example');
    expect(model.fullNameInput.errorMessage.text).toBe(errors.fullName.text);
    expect(model.dateOfBirthInput.items.map(({ value }) => value)).toEqual(['31', '2', '1990']);
    expect(model.dateOfBirthInput.errorMessage.text).toBe(errors.dateOfBirth.text);
    expect(model.countrySelect.items.find(({ value }) => value === 'scotland').selected).toBe(true);
    expect(model.countrySelect.errorMessage.text).toBe(errors.country.text);
  });

  test('does not add an unknown submitted country to the allow-listed options', () => {
    const model = supportAboutYouPageViewModel({ values: { country: '<script>' } });

    expect(model.countrySelect.items[0].selected).toBe(true);
    expect(model.countrySelect.items).not.toContainEqual(
      expect.objectContaining({ value: '<script>' }),
    );
  });
});
