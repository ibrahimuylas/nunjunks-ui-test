const {
  demoCaseworkCaseNoteCharacterLimit,
  demoCaseworkDecisions,
} = require('../../../validators/demo/casework/decision-validator');
const { demoShellViewModel } = require('../shell-view-model');
const { caseworkQueueContextPath, caseworkRecordViewModel } = require('./record-view-model');

function decisionPath(reference, suffix = '') {
  return `/demo/casework/requests/${encodeURIComponent(reference)}/decision${suffix}`;
}

function caseworkDecisionPageViewModel({ record, queueContext, values = {}, errors = {} } = {}) {
  if (!record || !queueContext) {
    throw new TypeError('Demo casework decision record and queue context are required');
  }

  const errorList = Object.values(errors);
  const heading = `Record a decision for ${record.reference}`;

  return {
    ...demoShellViewModel({
      pageTitle: errorList.length ? `Error: ${heading}` : heading,
      navigationSection: 'casework',
    }),
    backLink: {
      text: 'Back',
      href: caseworkQueueContextPath(
        `/demo/casework/requests/${encodeURIComponent(record.reference)}`,
        queueContext.tab,
        queueContext.page,
      ),
    },
    heading,
    caption: record.applicantAlias,
    errorSummary: errorList.length
      ? {
          titleText: 'There is a problem',
          errorList,
        }
      : null,
    formAction: caseworkQueueContextPath(
      decisionPath(record.reference),
      queueContext.tab,
      queueContext.page,
    ),
    decisionRadios: {
      idPrefix: 'decision',
      name: 'decision',
      fieldset: {
        legend: {
          text: 'What demonstration decision do you want to record?',
          classes: 'govuk-fieldset__legend--m',
        },
      },
      hint: {
        text: 'This changes only the fictional record in your current demo session.',
      },
      errorMessage: errors.decision ? { text: errors.decision.text } : null,
      items: demoCaseworkDecisions.map(({ value, text }) => ({
        value,
        text,
        checked: values.decision === value,
      })),
    },
    caseNoteTextarea: {
      id: 'caseNote',
      name: 'caseNote',
      value: values.caseNote || '',
      label: {
        text: 'Case note (optional)',
        classes: 'govuk-label--m',
      },
      hint: {
        text: `Enter fictional information only, up to ${demoCaseworkCaseNoteCharacterLimit.toLocaleString('en-GB')} characters.`,
      },
      errorMessage: errors.caseNote ? { text: errors.caseNote.text } : null,
      rows: 6,
      attributes: {
        maxlength: demoCaseworkCaseNoteCharacterLimit,
      },
    },
    warningText: {
      iconFallbackText: 'Warning',
      text: 'Saving will move this fictional request to Completed for the rest of your demo session.',
    },
    saveButton: {
      text: 'Save demonstration decision',
    },
  };
}

function caseworkDecisionOutcomePageViewModel({ record, queueContext } = {}) {
  if (!record || !queueContext) {
    throw new TypeError('Saved demo casework decision and queue context are required');
  }

  const status = caseworkRecordViewModel(record).statusTag.text;
  const heading = `Fictional decision saved for ${record.reference}`;

  return {
    ...demoShellViewModel({
      pageTitle: heading,
      navigationSection: 'casework',
    }),
    heading,
    notificationBanner: {
      type: 'success',
      text: `Fictional request ${record.reference} was recorded as ${status} for this demonstration.`,
    },
    returnLink: {
      text: 'Return to the same fictional request queue',
      href: caseworkQueueContextPath('/demo/casework/queue', queueContext.tab, queueContext.page),
    },
  };
}

module.exports = {
  caseworkDecisionOutcomePageViewModel,
  caseworkDecisionPageViewModel,
};
