const {
  demoSupportDescriptionCharacterLimit,
  demoSupportTypes,
} = require('../../../config/demo-support-types');
const { demoShellViewModel } = require('../shell-view-model');

function supportNeedsPageViewModel({
  values = {},
  errors = {},
  backLinkHref = '/demo/support/tasks',
  formAction = '/demo/support/support-needs',
} = {}) {
  const supportTypes = Array.isArray(values.supportTypes) ? values.supportTypes : [];
  const errorList = Object.values(errors);

  return {
    ...demoShellViewModel({
      pageTitle: errorList.length ? 'Error: Support needs' : 'Support needs',
      navigationSection: 'support',
    }),
    backLink: {
      text: 'Back',
      href: backLinkHref,
    },
    heading: 'Support needs',
    errorSummary: errorList.length
      ? {
          titleText: 'There is a problem',
          errorList,
        }
      : null,
    formAction,
    supportTypesCheckboxes: {
      idPrefix: 'supportTypes',
      name: 'supportTypes',
      fieldset: {
        legend: {
          text: 'What types of fictional support are needed?',
          classes: 'govuk-fieldset__legend--m',
        },
      },
      hint: {
        text: 'Select all that apply. Do not describe a real person or situation.',
      },
      errorMessage: errors.supportTypes ? { text: errors.supportTypes.text } : null,
      items: demoSupportTypes.map((supportType) => ({
        ...supportType,
        checked: supportTypes.includes(supportType.value),
      })),
    },
    descriptionCharacterCount: {
      id: 'description',
      name: 'description',
      maxlength: demoSupportDescriptionCharacterLimit,
      value: values.description || '',
      label: {
        text: 'Describe the fictional support needed',
        classes: 'govuk-label--m',
      },
      hint: {
        text: 'Give a short description of the fictional situation and what would help.',
      },
      errorMessage: errors.description ? { text: errors.description.text } : null,
      rows: 8,
    },
    additionalInformationTextarea: {
      id: 'additionalInformation',
      name: 'additionalInformation',
      value: values.additionalInformation || '',
      label: {
        text: 'Additional information (optional)',
        classes: 'govuk-label--m',
      },
      hint: {
        text: 'Add any other fictional information that would help explain the request.',
      },
      rows: 5,
    },
  };
}

module.exports = { supportNeedsPageViewModel };
