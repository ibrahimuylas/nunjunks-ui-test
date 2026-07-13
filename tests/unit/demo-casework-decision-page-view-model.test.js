const { demoCaseworkRecords } = require('../../src/app/config/demo-casework-records');
const {
  caseworkDecisionOutcomePageViewModel,
  caseworkDecisionPageViewModel,
} = require('../../src/app/view-models/demo/casework/decision-page-view-model');

const record = demoCaseworkRecords.find((candidate) => candidate.reference === 'DEMO-CW-2006');
const queueContext = { tab: 'my-requests', page: 2 };

describe('demo casework decision page view model', () => {
  test('prepares the protected linear form with exact queue context and GOV.UK options', () => {
    const model = caseworkDecisionPageViewModel({ record, queueContext });

    expect(model.pageTitle).toBe('Record a decision for DEMO-CW-2006');
    expect(model.heading).toBe('Record a decision for DEMO-CW-2006');
    expect(model.caption).toBe('Demo household Linden');
    expect(model.backLink).toEqual({
      text: 'Back',
      href: '/demo/casework/requests/DEMO-CW-2006?tab=my-requests&page=2',
    });
    expect(model.formAction).toBe(
      '/demo/casework/requests/DEMO-CW-2006/decision?tab=my-requests&page=2',
    );
    expect(model.decisionRadios.items).toEqual([
      { value: 'priority', text: 'Priority', checked: false },
      { value: 'standard', text: 'Standard', checked: false },
      {
        value: 'more-information-needed',
        text: 'More information needed',
        checked: false,
      },
    ]);
    expect(model.caseNoteTextarea).toMatchObject({
      id: 'caseNote',
      name: 'caseNote',
      value: '',
      attributes: { maxlength: 1000 },
    });
    expect(model.warningText.text).toContain('move this fictional request to Completed');
    expect(model.serviceNavigation.navigation).toContainEqual(
      expect.objectContaining({ text: 'Caseworker journey', active: true }),
    );
  });

  test('maps linked errors and retains normalized decision values', () => {
    const decisionError = {
      text: 'Select a demonstration decision',
      href: '#decision',
    };
    const noteError = {
      text: 'Case note must be 1000 characters or fewer',
      href: '#caseNote',
    };
    const model = caseworkDecisionPageViewModel({
      record,
      queueContext,
      values: { decision: 'standard', caseNote: 'Retained fictional note' },
      errors: { decision: decisionError, caseNote: noteError },
    });

    expect(model.pageTitle).toBe('Error: Record a decision for DEMO-CW-2006');
    expect(model.errorSummary).toEqual({
      titleText: 'There is a problem',
      errorList: [decisionError, noteError],
    });
    expect(model.decisionRadios.errorMessage).toEqual({ text: decisionError.text });
    expect(model.decisionRadios.items.find((item) => item.value === 'standard').checked).toBe(true);
    expect(model.caseNoteTextarea.value).toBe('Retained fictional note');
    expect(model.caseNoteTextarea.errorMessage).toEqual({ text: noteError.text });
  });

  test('prepares a success outcome with status and same-context return', () => {
    const model = caseworkDecisionOutcomePageViewModel({
      record: { ...record, status: 'more-information-needed', queue: 'completed' },
      queueContext,
    });

    expect(model.pageTitle).toBe('Decision saved for DEMO-CW-2006');
    expect(model.notificationBanner).toEqual({
      type: 'success',
      text: 'Request DEMO-CW-2006 was recorded as More information needed.',
    });
    expect(model.returnLink).toEqual({
      text: 'Return to the same fictional request queue',
      href: '/demo/casework/queue?tab=my-requests&page=2',
    });
  });

  test('rejects missing records and unsafe display values', () => {
    expect(() => caseworkDecisionPageViewModel()).toThrow(
      'Demo casework decision record and queue context are required',
    );
    expect(() => caseworkDecisionOutcomePageViewModel()).toThrow(
      'Saved demo casework decision and queue context are required',
    );
    expect(() =>
      caseworkDecisionOutcomePageViewModel({
        record: { ...record, status: 'unknown' },
        queueContext,
      }),
    ).toThrow('Demo casework urgency and status must be allow-listed');
  });
});
