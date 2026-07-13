const path = require('node:path');
const {
  demoCaseworkPageSize,
  demoCaseworkRecords,
  demoCaseworkStatuses,
  demoCaseworkTabs,
  demoCaseworkUrgencies,
} = require('../../src/app/config/demo-casework-records');
const demoCaseworkService = require('../../src/app/services/demo-casework-service');

const allowedSupportTypes = new Set([
  'Somewhere safe to stay',
  'Help to stay safe',
  'Food and essential items',
  'Health and wellbeing support',
]);
const completedStatuses = new Set(['priority', 'standard', 'more-information-needed']);

function caseworkSessionWith(records) {
  return {
    demo: {
      casework: {
        values: { records },
        completion: {},
      },
    },
  };
}

function allNestedValuesAreFrozen(value) {
  if (value === null || typeof value !== 'object') {
    return true;
  }

  return Object.isFrozen(value) && Object.values(value).every(allNestedValuesAreFrozen);
}

function collectKeys(value) {
  if (value === null || typeof value !== 'object') {
    return [];
  }

  return [
    ...Object.keys(value),
    ...Object.values(value).flatMap((nestedValue) => collectKeys(nestedValue)),
  ];
}

describe('demo casework service', () => {
  test('provides a deeply immutable and valid fictional fixture set', () => {
    const references = new Set();

    expect(demoCaseworkRecords).toHaveLength(18);
    expect(allNestedValuesAreFrozen(demoCaseworkRecords)).toBe(true);

    demoCaseworkRecords.forEach((record) => {
      expect(record).toEqual({
        reference: expect.stringMatching(/^DEMO-CW-\d{4}$/),
        applicantAlias: expect.stringMatching(/^Demo household [A-Z][a-z]+$/),
        receivedDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        urgency: expect.any(String),
        status: expect.any(String),
        queue: expect.any(String),
        summary: {
          household: expect.stringContaining('Fictional household'),
          supportTypes: expect.any(Array),
          description: expect.stringContaining('Demonstration request'),
          additionalInformation: expect.any(String),
        },
        auditText: expect.stringMatching(/[Ff]ictional|[Dd]emonstration/),
        evidenceFilename: expect.stringMatching(/^[a-z0-9][a-z0-9._-]*\.(pdf|jpg|png)$/),
      });
      expect(references.has(record.reference)).toBe(false);
      expect(demoCaseworkTabs).toContain(record.queue);
      expect(demoCaseworkUrgencies).toContain(record.urgency);
      expect(demoCaseworkStatuses).toContain(record.status);
      expect(record.summary.supportTypes.length).toBeGreaterThan(0);
      expect(record.summary.supportTypes.every((type) => allowedSupportTypes.has(type))).toBe(true);
      expect(path.basename(record.evidenceFilename)).toBe(record.evidenceFilename);
      expect(Number.isNaN(Date.parse(`${record.receivedDate}T00:00:00Z`))).toBe(false);

      if (record.queue === 'unassigned') {
        expect(record.status).toBe('unassigned');
      } else if (record.queue === 'my-requests') {
        expect(record.status).toBe('assigned');
      } else {
        expect(completedStatuses.has(record.status)).toBe(true);
      }

      references.add(record.reference);
    });

    expect(collectKeys(demoCaseworkRecords)).not.toEqual(
      expect.arrayContaining(['buffer', 'contents', 'fileContents', 'password', 'path']),
    );
  });

  test.each(demoCaseworkTabs)('seeds enough %s records to require pagination', (tab) => {
    const records = demoCaseworkRecords.filter((record) => record.queue === tab);

    expect(records).toHaveLength(6);
    expect(records.length).toBeGreaterThan(demoCaseworkPageSize);
  });

  test.each(demoCaseworkTabs)('selects and filters the %s queue', (selectedTab) => {
    const queue = demoCaseworkService.getQueue({}, selectedTab);

    expect(queue.selectedTab).toBe(selectedTab);
    expect(queue.selectedPage).toBe(1);
    expect(queue.requiresCanonicalRedirect).toBe(false);
    expect(queue.tabs.map((tab) => tab.key)).toEqual(demoCaseworkTabs);
    queue.tabs.forEach((tab) => {
      expect(tab.records).toHaveLength(demoCaseworkPageSize);
      expect(tab.records.every((record) => record.queue === tab.key)).toBe(true);
      expect(tab.pagination).toEqual({ currentPage: 1, pageCount: 2, totalRecords: 6 });
    });
  });

  test.each([
    [undefined, false],
    ['', true],
    ['unknown', true],
    [['completed'], true],
  ])(
    'defaults an empty or unknown queue filter %p to unassigned',
    (requestedTab, requiresCanonicalRedirect) => {
      const queue = demoCaseworkService.getQueue({}, requestedTab);

      expect(queue.selectedTab).toBe('unassigned');
      expect(queue.requiresCanonicalRedirect).toBe(requiresCanonicalRedirect);
    },
  );

  test.each([
    [1, ['DEMO-CW-4001', 'DEMO-CW-4002', 'DEMO-CW-4003', 'DEMO-CW-4004', 'DEMO-CW-4005']],
    [2, ['DEMO-CW-4006', 'DEMO-CW-4007', 'DEMO-CW-4008', 'DEMO-CW-4009', 'DEMO-CW-4010']],
    [3, ['DEMO-CW-4011', 'DEMO-CW-4012']],
  ])('returns the expected records for queue page %i', (page, expectedReferences) => {
    const records = Array.from({ length: 12 }, (_, index) => ({
      ...demoCaseworkRecords[index % 6],
      reference: `DEMO-CW-${4001 + index}`,
      queue: 'unassigned',
    }));
    const queue = demoCaseworkService.getQueue(
      caseworkSessionWith(records),
      'unassigned',
      String(page),
    );
    const selectedQueue = queue.tabs.find((tab) => tab.key === 'unassigned');

    expect(selectedQueue.records.map((record) => record.reference)).toEqual(expectedReferences);
    expect(selectedQueue.pagination).toEqual({
      currentPage: page,
      pageCount: 3,
      totalRecords: 12,
    });
    expect(queue.selectedPage).toBe(page);
    expect(queue.requiresCanonicalRedirect).toBe(false);
  });

  test.each(['', '0', '-1', '1.5', '2-and-more', '01', ['2']])(
    'canonicalizes invalid queue page %p to the first page',
    (requestedPage) => {
      const queue = demoCaseworkService.getQueue({}, 'my-requests', requestedPage);

      expect(queue.selectedPage).toBe(1);
      expect(queue.requiresCanonicalRedirect).toBe(true);
      expect(queue.tabs.find((tab) => tab.key === 'my-requests').records[0].reference).toBe(
        'DEMO-CW-2001',
      );
    },
  );

  test('canonicalizes an out-of-range page to the last available page', () => {
    const queue = demoCaseworkService.getQueue({}, 'completed', '99');
    const selectedQueue = queue.tabs.find((tab) => tab.key === 'completed');

    expect(queue.selectedPage).toBe(2);
    expect(queue.requiresCanonicalRedirect).toBe(true);
    expect(selectedQueue.pagination).toEqual({ currentPage: 2, pageCount: 2, totalRecords: 6 });
    expect(selectedQueue.records.map((record) => record.reference)).toEqual(['DEMO-CW-3006']);
  });

  test('finds a request while retaining only validated queue context', () => {
    const request = demoCaseworkService.getRequest({}, 'DEMO-CW-2006', 'my-requests', '2');

    expect(request).toEqual({
      record: demoCaseworkRecords.find((record) => record.reference === 'DEMO-CW-2006'),
      queueContext: { tab: 'my-requests', page: 2 },
      requiresCanonicalRedirect: false,
    });
  });

  test('canonicalizes unsafe request context and rejects an unknown reference', () => {
    expect(demoCaseworkService.getRequest({}, 'DEMO-CW-1001', 'unknown', '0')).toEqual(
      expect.objectContaining({
        queueContext: { tab: 'unassigned', page: 1 },
        requiresCanonicalRedirect: true,
      }),
    );
    expect(demoCaseworkService.getRequest({}, 'DEMO-CW-9999', 'completed', '2')).toBeNull();
  });

  test('clones the fixtures lazily into a casework session', () => {
    const session = {};

    expect(session.demo).toBeUndefined();

    const records = demoCaseworkService.getRecords(session);

    expect(records).toEqual(demoCaseworkRecords);
    expect(session.demo.casework.values.records).toEqual(demoCaseworkRecords);
    expect(session.demo.casework.values.records).not.toBe(demoCaseworkRecords);
    expect(session.demo.casework.values.records[0]).not.toBe(demoCaseworkRecords[0]);
    expect(session.demo.casework.completion).toEqual({});
  });

  test('grants access using only a boolean completion flag', () => {
    const session = {};

    expect(demoCaseworkService.hasAccess(session)).toBe(false);
    expect(demoCaseworkService.getAccessRedirect(session)).toBe('/demo/casework/sign-in');

    demoCaseworkService.grantAccess(session);

    expect(demoCaseworkService.hasAccess(session)).toBe(true);
    expect(demoCaseworkService.getAccessRedirect(session)).toBeNull();
    expect(session.demo.casework).toEqual({
      values: {},
      completion: { signedIn: true },
    });
  });

  test('isolates stored records and returned snapshots between sessions', () => {
    const firstSession = {};
    const secondSession = {};
    const firstRecords = demoCaseworkService.getRecords(firstSession);

    demoCaseworkService.getRecords(secondSession);
    firstRecords[0].summary.supportTypes.push('Changed through a returned snapshot');
    firstSession.demo.casework.values.records[0].status = 'changed-in-first-session';

    expect(demoCaseworkService.getRecords(firstSession)[0].summary.supportTypes).toEqual(
      demoCaseworkRecords[0].summary.supportTypes,
    );
    expect(demoCaseworkService.getRecords(firstSession)[0].status).toBe('changed-in-first-session');
    expect(demoCaseworkService.getRecords(secondSession)[0]).toEqual(demoCaseworkRecords[0]);
    expect(secondSession.demo.casework.values.records).not.toBe(
      firstSession.demo.casework.values.records,
    );
    expect(demoCaseworkRecords[0].status).toBe('unassigned');
  });

  test('restores pristine records with a casework-only reset', () => {
    const legacyJourney = { answers: { fullName: 'Legacy User' }, complete: true };
    const support = {
      values: { eligibility: 'eligible' },
      completion: { aboutYou: true },
    };
    const session = {
      journey: legacyJourney,
      demo: {
        support,
        cookiePreference: 'accepted',
      },
    };

    demoCaseworkService.getRecords(session);
    session.demo.casework.values.records[0].status = 'changed-in-session';
    session.demo.casework.completion.signedIn = true;

    demoCaseworkService.reset(session);

    expect(session.demo.casework).toEqual({ values: {}, completion: {} });
    expect(session.demo.support).toBe(support);
    expect(session.demo.cookiePreference).toBe('accepted');
    expect(session.journey).toBe(legacyJourney);
    expect(demoCaseworkService.getRecords(session)).toEqual(demoCaseworkRecords);
    expect(session.demo.casework.completion).toEqual({});
  });
});
