const {
  supportNeedsPageViewModel,
} = require('../../src/app/view-models/demo/support/support-needs-page-view-model');

describe('demo support-needs page view model', () => {
  test('prepares checkboxes, a 500-character count and an optional textarea', () => {
    const model = supportNeedsPageViewModel();

    expect(model.pageTitle).toBe('Support needs');
    expect(model.heading).toBe('Support needs');
    expect(model.backLink).toEqual({ text: 'Back', href: '/demo/support/tasks' });
    expect(model.formAction).toBe('/demo/support/support-needs');
    expect(model.supportTypesCheckboxes).toMatchObject({
      idPrefix: 'supportTypes',
      name: 'supportTypes',
      fieldset: {
        legend: { text: 'What types of fictional support are needed?' },
      },
      hint: { text: expect.stringContaining('Select all that apply') },
    });
    expect(model.supportTypesCheckboxes.items.map(({ value }) => value)).toEqual([
      'safe-accommodation',
      'personal-safety',
      'essential-items',
      'wellbeing',
    ]);
    expect(model.supportTypesCheckboxes.items.every(({ checked }) => checked === false)).toBe(true);
    expect(model.descriptionCharacterCount).toMatchObject({
      id: 'description',
      name: 'description',
      maxlength: 500,
      value: '',
      label: { text: 'Describe the fictional support needed' },
    });
    expect(model.additionalInformationTextarea).toMatchObject({
      id: 'additionalInformation',
      name: 'additionalInformation',
      value: '',
      label: { text: 'Additional information (optional)' },
    });
    expect(model.serviceNavigation.navigation).toContainEqual(
      expect.objectContaining({ text: 'Public journey', active: true }),
    );
  });

  test('retains all valid fields and maps linked errors to GOV.UK options', () => {
    const errors = {
      supportTypes: {
        text: 'Select fictional support types from the list',
        href: '#supportTypes',
      },
      description: {
        text: 'Description must be 500 characters or fewer',
        href: '#description',
      },
    };
    const model = supportNeedsPageViewModel({
      values: {
        supportTypes: ['safe-accommodation', 'wellbeing'],
        description: 'x'.repeat(501),
        additionalInformation: 'Fictional follow-up details',
      },
      errors,
    });

    expect(model.pageTitle).toBe('Error: Support needs');
    expect(model.errorSummary).toEqual({
      titleText: 'There is a problem',
      errorList: Object.values(errors),
    });
    expect(
      model.supportTypesCheckboxes.items.filter(({ checked }) => checked).map(({ value }) => value),
    ).toEqual(['safe-accommodation', 'wellbeing']);
    expect(model.supportTypesCheckboxes.errorMessage.text).toBe(errors.supportTypes.text);
    expect(model.descriptionCharacterCount.value).toHaveLength(501);
    expect(model.descriptionCharacterCount.errorMessage.text).toBe(errors.description.text);
    expect(model.additionalInformationTextarea.value).toBe('Fictional follow-up details');
  });

  test('does not add or select an unknown submitted support type', () => {
    const model = supportNeedsPageViewModel({
      values: { supportTypes: ['unknown', 'safe-accommodation'] },
    });

    expect(model.supportTypesCheckboxes.items).not.toContainEqual(
      expect.objectContaining({ value: 'unknown' }),
    );
    expect(model.supportTypesCheckboxes.items[0].checked).toBe(true);
  });
});
