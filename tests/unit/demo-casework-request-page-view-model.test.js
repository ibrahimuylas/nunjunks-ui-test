const { demoCaseworkRecords } = require('../../src/app/config/demo-casework-records');
const {
  caseworkRequestPageViewModel,
} = require('../../src/app/view-models/demo/casework/request-page-view-model');

const record = demoCaseworkRecords.find((candidate) => candidate.reference === 'DEMO-CW-2006');

describe('demo casework request page view model', () => {
  test('prepares the casework shell, breadcrumbs and exact queue-context actions', () => {
    const model = caseworkRequestPageViewModel({
      record,
      queueContext: { tab: 'my-requests', page: 2 },
    });

    expect(model.pageTitle).toBe('Request DEMO-CW-2006');
    expect(model.heading).toBe('Request DEMO-CW-2006');
    expect(model.caption).toBe('Demo household Linden');
    expect(model.serviceNavigation.navigation).toContainEqual(
      expect.objectContaining({ text: 'Caseworker journey', active: true }),
    );
    expect(model.breadcrumbs.items).toEqual([
      { text: 'Demo home', href: '/demo' },
      {
        text: 'Fictional support request queue',
        href: '/demo/casework/queue?tab=my-requests&page=2',
      },
      { text: 'DEMO-CW-2006' },
    ]);
    expect(model.decisionButton).toEqual({
      text: 'Record a decision',
      href: '/demo/casework/requests/DEMO-CW-2006/decision?tab=my-requests&page=2',
    });
    expect(model.returnLink).toEqual({
      text: 'Return to my requests queue',
      href: '/demo/casework/queue?tab=my-requests&page=2',
    });
  });

  test('maps the fictional record into summary-list cards and audit details', () => {
    const model = caseworkRequestPageViewModel({
      record,
      queueContext: { tab: 'my-requests', page: 2 },
    });

    expect(model.summaryLists).toEqual([
      {
        card: { title: { text: 'Request details' } },
        rows: [
          { key: { text: 'Reference' }, value: { text: 'DEMO-CW-2006' } },
          {
            key: { text: 'Applicant alias' },
            value: { text: 'Demo household Linden' },
          },
          { key: { text: 'Received' }, value: { text: '7 July 2026' } },
          { key: { text: 'Urgency' }, value: { text: 'High' } },
          { key: { text: 'Status' }, value: { text: 'Assigned' } },
        ],
      },
      {
        card: { title: { text: 'Fictional support request' } },
        rows: [
          {
            key: { text: 'Household' },
            value: { text: 'Fictional household with one adult and three children.' },
          },
          {
            key: { text: 'Types of support' },
            value: { text: 'Somewhere safe to stay, Health and wellbeing support' },
          },
          {
            key: { text: 'Description' },
            value: { text: 'Demonstration request for housing and wellbeing triage.' },
          },
          {
            key: { text: 'Additional information' },
            value: {
              text: 'The fictional household needs space for medical equipment.',
            },
          },
          {
            key: { text: 'Evidence filename' },
            value: { text: 'demo-only-linden-summary.png' },
          },
        ],
      },
    ]);
    expect(model.auditDetails).toEqual({
      summaryText: 'View audit information',
      text: 'Assigned to the current fictional caseworker for demonstration.',
    });
  });

  test('exposes only safe record fields and rejects unvalidated display values', () => {
    const model = caseworkRequestPageViewModel({
      record: { ...record, evidenceContents: 'sensitive file bytes' },
      queueContext: { tab: 'my-requests', page: 2 },
    });

    expect(JSON.stringify(model)).not.toContain('sensitive file bytes');
    expect(() =>
      caseworkRequestPageViewModel({
        record,
        queueContext: { tab: 'unknown', page: 2 },
      }),
    ).toThrow('Demo casework queue tab must be allow-listed');
    expect(() =>
      caseworkRequestPageViewModel({
        record: { ...record, status: 'unknown' },
        queueContext: { tab: 'my-requests', page: 2 },
      }),
    ).toThrow('Demo casework urgency and status must be allow-listed');
  });
});
