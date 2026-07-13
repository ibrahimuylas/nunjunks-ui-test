const { URLSearchParams } = require('node:url');
const { demoCaseworkTabs } = require('../../../config/demo-casework-records');

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

function caseworkQueueTabLabel(tab) {
  if (!demoCaseworkTabs.includes(tab) || !tabLabels[tab]) {
    throw new TypeError('Demo casework queue tab must be allow-listed');
  }

  return tabLabels[tab];
}

function caseworkQueueContextPath(path, tab, page) {
  caseworkQueueTabLabel(tab);

  if (!Number.isSafeInteger(page) || page < 1) {
    throw new TypeError('Demo casework queue page must be a positive integer');
  }

  const query = new URLSearchParams({ tab, page: String(page) });
  return `${path}?${query}`;
}

function caseworkRecordViewModel(record) {
  const urgency = urgencyLabels[record.urgency];
  const statusTag = statusTags[record.status];

  if (!urgency || !statusTag) {
    throw new TypeError('Demo casework urgency and status must be allow-listed');
  }

  return {
    receivedDate: dateFormatter.format(new Date(`${record.receivedDate}T00:00:00Z`)),
    urgency,
    statusTag,
  };
}

module.exports = {
  caseworkQueueContextPath,
  caseworkQueueTabLabel,
  caseworkRecordViewModel,
};
