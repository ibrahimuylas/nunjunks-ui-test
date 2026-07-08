const {
  personalDetailsPageViewModel,
} = require('../../src/app/view-models/personal-details-page-view-model');
const {
  checkAnswersPageViewModel,
  formatDateOfBirth,
  formatReceiveUpdates,
  formatYesNo,
} = require('../../src/app/view-models/check-answers-page-view-model');

describe('view models', () => {
  test('full name view model maps validation errors to GOV.UK component options', () => {
    const model = personalDetailsPageViewModel({
      answers: { fullName: '' },
      errors: {
        fullName: {
          text: 'Enter your full name',
          href: '#fullName',
        },
      },
    });

    expect(model.pageTitle).toMatch(/^Error:/);
    expect(model.errorSummary.errorList).toHaveLength(1);
    expect(model.fullNameInput.errorMessage.text).toBe('Enter your full name');
  });

  test('check answers view model includes change links', () => {
    const model = checkAnswersPageViewModel({
      answers: {
        hasFarmingBusiness: 'no',
        fullName: 'Jane Doe',
        dateOfBirth: { day: '7', month: '9', year: '1990', iso: '1990-09-07' },
        receiveUpdates: 'yes',
      },
    });

    expect(model.summaryList.rows[0].value.text).toBe('No');
    expect(model.summaryList.rows[1].value.text).toBe('Jane Doe');
    expect(model.summaryList.rows[1].actions.items[0].href).toBe('/full-name');
    expect(model.summaryList.rows[2].value.text).toBe('7 9 1990');
    expect(model.summaryList.rows[3].value.text).toBe('Yes');
  });

  test('check answers view model includes business branch rows', () => {
    const model = checkAnswersPageViewModel({
      answers: {
        hasFarmingBusiness: 'yes',
        businessName: 'Green Valley Farm',
        receiveUpdates: 'no',
      },
    });

    expect(model.summaryList.rows[0].value.text).toBe('Yes');
    expect(model.summaryList.rows[1].value.text).toBe('Green Valley Farm');
    expect(model.summaryList.rows[1].actions.items[0].href).toBe('/business-details');
    expect(model.summaryList.rows[2].value.text).toBe('No');
  });

  test('date of birth is formatted for display', () => {
    expect(formatDateOfBirth({ day: '7', month: '9', year: '1990' })).toBe('7 9 1990');
  });

  test('updates value is formatted for display', () => {
    expect(formatReceiveUpdates('yes')).toBe('Yes');
    expect(formatReceiveUpdates('no')).toBe('No');
  });

  test('yes/no values are formatted for display', () => {
    expect(formatYesNo('yes')).toBe('Yes');
    expect(formatYesNo('no')).toBe('No');
  });
});
