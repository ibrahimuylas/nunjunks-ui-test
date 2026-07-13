const { URLSearchParams } = require('node:url');
const { demoCaseworkTabs } = require('../../../config/demo-casework-records');
const { demoShellViewModel } = require('../shell-view-model');

const queuePath = '/demo/casework/queue';
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const tabLabels = Object.freeze({
  unassigned: 'Unassigned',
  'my-requests': 'My requests',
  completed: 'Completed',
});

const urgencyLabels = Object.freeze({
  immediate: 'Immediate',
  high: 'High',
  routine: 'Routine',
});

const statusTags = Object.freeze({
  unassigned: Object.freeze({ text: 'Unassigned', classes: 'govuk-tag--grey' }),
  assigned: Object.freeze({ text: 'Assigned', classes: 'govuk-tag--blue' }),
  priority: Object.freeze({ text: 'Priority', classes: 'govuk-tag--red' }),
  standard: Object.freeze({ text: 'Standard', classes: 'govuk-tag--green' }),
  'more-information-needed': Object.freeze({
    text: 'More information needed',
    classes: 'govuk-tag--yellow',
  }),
});

const tableHead = Object.freeze([
  Object.freeze({ text: 'Reference' }),
  Object.freeze({ text: 'Applicant alias' }),
  Object.freeze({ text: 'Received' }),
  Object.freeze({ text: 'Urgency' }),
  Object.freeze({ text: 'Status' }),
]);

function formatDate(receivedDate) {
  return dateFormatter.format(new Date(`${receivedDate}T00:00:00Z`));
}

function queueContextPath(path, tab, page) {
  const query = new URLSearchParams({ tab, page: String(page) });
  return `${path}?${query}`;
}

function queueRowViewModel(record, tab, page) {
  const urgency = urgencyLabels[record.urgency];
  const statusTag = statusTags[record.status];

  if (!urgency || !statusTag) {
    throw new TypeError('Demo casework urgency and status must be allow-listed');
  }

  return {
    reference: record.reference,
    requestHref: queueContextPath(
      `/demo/casework/requests/${encodeURIComponent(record.reference)}`,
      tab,
      page,
    ),
    applicantAlias: record.applicantAlias,
    receivedDate: formatDate(record.receivedDate),
    urgency,
    statusTag,
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
      currentPage > 1 ? { href: queueContextPath(queuePath, tab.key, currentPage - 1) } : undefined,
    items: Array.from({ length: pageCount }, (_, index) => {
      const page = index + 1;

      return {
        number: page,
        href: queueContextPath(queuePath, tab.key, page),
        current: page === currentPage,
      };
    }),
    next:
      currentPage < pageCount
        ? { href: queueContextPath(queuePath, tab.key, currentPage + 1) }
        : undefined,
  };
}

function queueTableViewModel(tab) {
  const label = tabLabels[tab.key];

  if (!label || !tab.pagination) {
    throw new TypeError('Demo casework queue tab must be allow-listed');
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
    text: tabLabels[tab],
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
          label: tabLabels[key],
          table: queueTableViewModel(tab),
        };
      }),
    },
  };
}

module.exports = { caseworkQueuePageViewModel };
