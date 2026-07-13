const { demoCaseworkTabs } = require('../../../config/demo-casework-records');
const { demoShellViewModel } = require('../shell-view-model');
const {
  caseworkQueueContextPath,
  caseworkQueueTabLabel,
  caseworkRecordViewModel,
} = require('./record-view-model');

const queuePath = '/demo/casework/queue';

const tableHead = Object.freeze([
  Object.freeze({ text: 'Reference' }),
  Object.freeze({ text: 'Applicant alias' }),
  Object.freeze({ text: 'Received' }),
  Object.freeze({ text: 'Urgency' }),
  Object.freeze({ text: 'Status' }),
]);

function queueRowViewModel(record, tab, page) {
  const displayRecord = caseworkRecordViewModel(record);

  return {
    reference: record.reference,
    requestHref: caseworkQueueContextPath(
      `/demo/casework/requests/${encodeURIComponent(record.reference)}`,
      tab,
      page,
    ),
    applicantAlias: record.applicantAlias,
    ...displayRecord,
  };
}

function paginationViewModel(tab, label) {
  const { currentPage, pageCount } = tab.pagination;

  if (pageCount <= 1) {
    return null;
  }

  return {
    landmarkLabel: `${label} fictional requests pagination`,
    previous:
      currentPage > 1
        ? { href: caseworkQueueContextPath(queuePath, tab.key, currentPage - 1) }
        : undefined,
    items: Array.from({ length: pageCount }, (_, index) => {
      const page = index + 1;

      return {
        number: page,
        href: caseworkQueueContextPath(queuePath, tab.key, page),
        current: page === currentPage,
      };
    }),
    next:
      currentPage < pageCount
        ? { href: caseworkQueueContextPath(queuePath, tab.key, currentPage + 1) }
        : undefined,
  };
}

function queueTableViewModel(tab) {
  const label = caseworkQueueTabLabel(tab.key);

  if (!tab.pagination) {
    throw new TypeError('Demo casework queue pagination is required');
  }

  return {
    caption: `${label} fictional requests`,
    head: tableHead,
    rows: tab.records.map((record) =>
      queueRowViewModel(record, tab.key, tab.pagination.currentPage),
    ),
    pagination: paginationViewModel(tab, label),
  };
}

function filterLinkViewModel(tab, selectedTab) {
  return {
    text: caseworkQueueTabLabel(tab),
    href: `${queuePath}?tab=${tab}`,
    current: tab === selectedTab,
  };
}

function caseworkQueuePageViewModel({ selectedTab = demoCaseworkTabs[0], tabs = [] } = {}) {
  if (!demoCaseworkTabs.includes(selectedTab)) {
    throw new TypeError('Selected demo casework queue tab must be allow-listed');
  }

  const tabsByKey = new Map(tabs.map((tab) => [tab.key, tab]));
  const selectedFirst = [selectedTab, ...demoCaseworkTabs.filter((tab) => tab !== selectedTab)];
  const assignedCount = tabsByKey.get('my-requests')?.pagination?.totalRecords || 0;

  return {
    ...demoShellViewModel({
      pageTitle: 'Fictional support request queue',
      navigationSection: 'casework',
    }),
    heading: 'Fictional support request queue',
    notificationBanner: {
      titleText: 'New fictional work',
      text: `${assignedCount} newly assigned fictional ${assignedCount === 1 ? 'request is' : 'requests are'} available in My requests.`,
    },
    filterLinks: demoCaseworkTabs.map((tab) => filterLinkViewModel(tab, selectedTab)),
    tabs: {
      idPrefix: 'casework-queue',
      title: 'Fictional request queues',
      items: selectedFirst.map((key) => {
        const tab = tabsByKey.get(key) || {
          key,
          records: [],
          pagination: { currentPage: 1, pageCount: 1, totalRecords: 0 },
        };

        return {
          id: `casework-queue-${key}`,
          label: caseworkQueueTabLabel(key),
          table: queueTableViewModel(tab),
        };
      }),
    },
  };
}

module.exports = { caseworkQueuePageViewModel };
