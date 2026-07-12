const {
  formatDateOfBirth,
  formatSupportTypes,
  supportCheckAnswersPageViewModel,
} = require('../../src/app/view-models/demo/support/check-answers-page-view-model');

function completedValues(overrides = {}) {
  return {
    eligibility: 'eligible',
    aboutYou: {
      fullName: 'Alex <Example>',
      dateOfBirth: { day: '7', month: '9', year: '1990', iso: '1990-09-07' },
      country: 'scotland',
    },
    supportNeeds: {
      supportTypes: ['safe-accommodation', 'wellbeing'],
      description: 'A fictional <em>description</em>',
      additionalInformation: '',
    },
    evidence: { filename: 'fictional-evidence.pdf' },
    ...overrides,
  };
}

describe('demo support check-answers page view model', () => {
  test('groups every completed answer into page-ready summary cards', () => {
    const model = supportCheckAnswersPageViewModel({ values: completedValues() });

    expect(model.summaryLists.map((list) => list.card.title.text)).toEqual([
      'Eligibility',
      'About you',
      'Support needs',
      'Evidence',
    ]);
    expect(model.summaryLists.flatMap((list) => list.rows).map((row) => row.value.text)).toEqual([
      'Yes',
      'Alex <Example>',
      '7 September 1990',
      'Scotland',
      'Somewhere safe to stay, Health and wellbeing support',
      'A fictional <em>description</em>',
      'Not provided',
      'fictional-evidence.pdf',
    ]);
  });

  test('adds a specific change action for every editable answer', () => {
    const rows = supportCheckAnswersPageViewModel({
      values: completedValues(),
    }).summaryLists.flatMap((list) => list.rows);

    expect(rows.map((row) => row.actions.items[0])).toEqual([
      {
        href: '/demo/support/eligibility/change',
        text: 'Change',
        visuallyHiddenText: 'whether the fictional support request can continue',
      },
      {
        href: '/demo/support/about-you/change',
        text: 'Change',
        visuallyHiddenText: 'fictional full name',
      },
      {
        href: '/demo/support/about-you/change',
        text: 'Change',
        visuallyHiddenText: 'date of birth',
      },
      {
        href: '/demo/support/about-you/change',
        text: 'Change',
        visuallyHiddenText: 'current country',
      },
      {
        href: '/demo/support/support-needs/change',
        text: 'Change',
        visuallyHiddenText: 'types of support',
      },
      {
        href: '/demo/support/support-needs/change',
        text: 'Change',
        visuallyHiddenText: 'description of the fictional support needed',
      },
      {
        href: '/demo/support/support-needs/change',
        text: 'Change',
        visuallyHiddenText: 'additional information',
      },
      {
        href: '/demo/support/evidence/change',
        text: 'Change',
        visuallyHiddenText: 'supporting document',
      },
    ]);
  });

  test('prepares public navigation, back navigation and the explicit primary action', () => {
    const model = supportCheckAnswersPageViewModel({ values: completedValues() });

    expect(model.pageTitle).toBe('Check your answers');
    expect(model.heading).toBe('Check your answers');
    expect(model.backLink).toEqual({ text: 'Back', href: '/demo/support/tasks' });
    expect(model.formAction).toBe('/demo/support/check-answers');
    expect(model.submitButton).toEqual({ text: 'Submit fictional request' });
    expect(model.serviceNavigation.navigation).toContainEqual(
      expect.objectContaining({ text: 'Public journey', active: true }),
    );
  });

  test('shows a clear value when no evidence file was selected', () => {
    const values = completedValues({ evidence: { filename: null } });
    const model = supportCheckAnswersPageViewModel({ values });

    expect(model.summaryLists[3].rows[0].value.text).toBe('No file selected');
  });

  test('formats allow-listed dates and support types for display', () => {
    expect(formatDateOfBirth({ day: '07', month: '09', year: '1990' })).toBe('7 September 1990');
    expect(formatSupportTypes(['personal-safety', 'essential-items'])).toBe(
      'Help to stay safe, Food and essential items',
    );
  });
});
