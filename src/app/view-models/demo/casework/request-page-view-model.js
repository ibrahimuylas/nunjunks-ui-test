const { demoShellViewModel } = require('../shell-view-model');
const {
  caseworkQueueContextPath,
  caseworkQueueTabLabel,
  caseworkRecordViewModel,
} = require('./record-view-model');

function summaryRow(key, value) {
  return {
    key: { text: key },
    value: { text: value },
  };
}

function summaryCard(title, rows) {
  return {
    card: {
      title: { text: title },
    },
    rows,
  };
}

function caseworkRequestPageViewModel({ record, queueContext } = {}) {
  if (!record || !queueContext) {
    throw new TypeError('Demo casework request and queue context are required');
  }

  const displayRecord = caseworkRecordViewModel(record);
  const queueLabel = caseworkQueueTabLabel(queueContext.tab);
  const queueHref = caseworkQueueContextPath(
    '/demo/casework/queue',
    queueContext.tab,
    queueContext.page,
  );
  const requestPath = `/demo/casework/requests/${encodeURIComponent(record.reference)}`;

  return {
    ...demoShellViewModel({
      pageTitle: `Request ${record.reference}`,
      navigationSection: 'casework',
    }),
    breadcrumbs: {
      items: [
        { text: 'Demo home', href: '/demo' },
        { text: 'Fictional support request queue', href: queueHref },
        { text: record.reference },
      ],
    },
    heading: `Request ${record.reference}`,
    caption: record.applicantAlias,
    summaryLists: [
      summaryCard('Request details', [
        summaryRow('Reference', record.reference),
        summaryRow('Applicant alias', record.applicantAlias),
        summaryRow('Received', displayRecord.receivedDate),
        summaryRow('Urgency', displayRecord.urgency),
        summaryRow('Status', displayRecord.statusTag.text),
      ]),
      summaryCard('Fictional support request', [
        summaryRow('Household', record.summary.household),
        summaryRow('Types of support', record.summary.supportTypes.join(', ')),
        summaryRow('Description', record.summary.description),
        summaryRow('Additional information', record.summary.additionalInformation),
        summaryRow('Evidence filename', record.evidenceFilename),
      ]),
    ],
    auditDetails: {
      summaryText: 'View audit information',
      text: record.auditText,
    },
    decisionButton: {
      text: 'Record a decision',
      href: caseworkQueueContextPath(
        `${requestPath}/decision`,
        queueContext.tab,
        queueContext.page,
      ),
    },
    returnLink: {
      text: `Return to ${queueLabel.toLowerCase()} queue`,
      href: queueHref,
    },
  };
}

module.exports = { caseworkRequestPageViewModel };
