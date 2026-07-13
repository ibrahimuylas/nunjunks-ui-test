const {
  demoCaseworkRecords,
  demoCaseworkTabs,
} = require('../../src/app/config/demo-casework-records');
const {
  caseworkQueuePageViewModel,
} = require('../../src/app/view-models/demo/casework/queue-page-view-model');

function queueFixture(selectedTab = 'unassigned', records = demoCaseworkRecords) {
  return {
    selectedTab,
    tabs: demoCaseworkTabs.map((key) => ({
      key,
      records: records.filter((record) => record.queue === key),
    })),
  };
}

describe('demo casework queue page view model', () => {
  test.each([
    ['unassigned', ['Unassigned', 'My requests', 'Completed']],
    ['my-requests', ['My requests', 'Unassigned', 'Completed']],
    ['completed', ['Completed', 'Unassigned', 'My requests']],
  ])('puts the selected %s queue first while preserving every tab', (selectedTab, labels) => {
    const model = caseworkQueuePageViewModel(queueFixture(selectedTab));

    expect(model.tabs.items.map((item) => item.label)).toEqual(labels);
    expect(model.tabs.items[0].id).toBe(`casework-queue-${selectedTab}`);
    expect(model.tabs.items[0].table.rows).toHaveLength(6);
    expect(model.filterLinks).toEqual([
      {
        text: 'Unassigned',
        href: '/demo/casework/queue?tab=unassigned',
        current: selectedTab === 'unassigned',
      },
      {
        text: 'My requests',
        href: '/demo/casework/queue?tab=my-requests',
        current: selectedTab === 'my-requests',
      },
      {
        text: 'Completed',
        href: '/demo/casework/queue?tab=completed',
        current: selectedTab === 'completed',
      },
    ]);
  });

  test('formats queue rows and maps each status to an understandable GOV.UK tag', () => {
    const model = caseworkQueuePageViewModel(queueFixture());
    const rows = model.tabs.items.flatMap((item) => item.table.rows);

    expect(rows[0]).toEqual({
      reference: 'DEMO-CW-1001',
      applicantAlias: 'Demo household Aster',
      receivedDate: '12 July 2026',
      urgency: 'Immediate',
      statusTag: { text: 'Unassigned', classes: 'govuk-tag--grey' },
    });
    expect([...new Set(rows.map((row) => JSON.stringify(row.statusTag)))].map(JSON.parse)).toEqual([
      { text: 'Unassigned', classes: 'govuk-tag--grey' },
      { text: 'Assigned', classes: 'govuk-tag--blue' },
      { text: 'Priority', classes: 'govuk-tag--red' },
      { text: 'Standard', classes: 'govuk-tag--green' },
      { text: 'More information needed', classes: 'govuk-tag--yellow' },
    ]);
  });

  test('prepares the casework shell, notification and table headings', () => {
    const model = caseworkQueuePageViewModel(queueFixture());

    expect(model.pageTitle).toBe('Fictional support request queue');
    expect(model.heading).toBe('Fictional support request queue');
    expect(model.notificationBanner).toEqual({
      titleText: 'New fictional work',
      text: '6 newly assigned fictional requests are available in My requests.',
    });
    expect(model.serviceNavigation.navigation).toContainEqual(
      expect.objectContaining({ text: 'Caseworker journey', active: true }),
    );
    expect(model.tabs.items[0].table.head).toEqual([
      { text: 'Reference' },
      { text: 'Applicant alias' },
      { text: 'Received' },
      { text: 'Urgency' },
      { text: 'Status' },
    ]);
  });

  test('rejects unknown selected tabs, urgencies and statuses', () => {
    expect(() => caseworkQueuePageViewModel(queueFixture('unknown'))).toThrow(
      'Selected demo casework queue tab must be allow-listed',
    );

    for (const field of ['urgency', 'status']) {
      const records = [{ ...demoCaseworkRecords[0], [field]: 'unknown' }];

      expect(() => caseworkQueuePageViewModel(queueFixture('unassigned', records))).toThrow(
        'Demo casework urgency and status must be allow-listed',
      );
    }
  });
});
