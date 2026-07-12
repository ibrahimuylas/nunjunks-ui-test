const {
  evidenceFileAccept,
  evidenceFileTypeLabel,
  evidenceUploadLimits,
} = require('../../../validators/demo/support/evidence-validator');
const { demoShellViewModel } = require('../shell-view-model');

function supportEvidencePageViewModel({ values = {}, errors = {} } = {}) {
  const errorList = Object.values(errors);
  const selectedFilename = typeof values.filename === 'string' ? values.filename : null;

  return {
    ...demoShellViewModel({
      pageTitle: errorList.length ? 'Error: Evidence' : 'Evidence',
      navigationSection: 'support',
    }),
    backLink: {
      text: 'Back',
      href: '/demo/support/support-needs',
    },
    heading: 'Evidence',
    errorSummary: errorList.length
      ? {
          titleText: 'There is a problem',
          errorList,
        }
      : null,
    formAction: '/demo/support/evidence',
    selectedFilename,
    evidenceFileUpload: {
      id: 'evidence',
      name: 'evidence',
      javascript: true,
      label: {
        text: 'Upload a fictional supporting document (optional)',
        classes: 'govuk-label--m',
      },
      hint: {
        text: `${evidenceFileTypeLabel}. Maximum file size: ${evidenceUploadLimits.maxFileSizeLabel}. File contents are discarded and are not stored.`,
      },
      errorMessage: errors.evidence ? { text: errors.evidence.text } : null,
      attributes: {
        accept: evidenceFileAccept,
      },
    },
  };
}

module.exports = { supportEvidencePageViewModel };
