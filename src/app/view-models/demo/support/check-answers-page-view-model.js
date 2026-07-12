const { demoSupportCountries } = require('../../../config/demo-support-countries');
const { demoSupportTypes } = require('../../../config/demo-support-types');
const { demoShellViewModel } = require('../shell-view-model');

const monthNames = Object.freeze([
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]);

function changeAction(href, visuallyHiddenText) {
  return {
    items: [
      {
        href,
        text: 'Change',
        visuallyHiddenText,
      },
    ],
  };
}

function summaryRow(key, value, href, visuallyHiddenText) {
  return {
    key: { text: key },
    value: { text: value },
    actions: changeAction(href, visuallyHiddenText),
  };
}

function summaryCard(title, rows) {
  return {
    card: {
      title: { text: title },
      actions: { items: [] },
    },
    rows,
  };
}

function formatDateOfBirth(dateOfBirth) {
  const month = monthNames[Number(dateOfBirth.month) - 1];
  return `${Number(dateOfBirth.day)} ${month} ${dateOfBirth.year}`;
}

function optionText(options, value) {
  return options.find((option) => option.value === value)?.text || '';
}

function formatSupportTypes(supportTypes) {
  return supportTypes.map((value) => optionText(demoSupportTypes, value)).join(', ');
}

function supportCheckAnswersPageViewModel({ values }) {
  const aboutYou = values.aboutYou;
  const supportNeeds = values.supportNeeds;
  const evidence = values.evidence;

  return {
    ...demoShellViewModel({
      pageTitle: 'Check your answers',
      navigationSection: 'support',
    }),
    backLink: {
      text: 'Back',
      href: '/demo/support/tasks',
    },
    heading: 'Check your answers',
    summaryLists: [
      summaryCard('Eligibility', [
        summaryRow(
          'Can this fictional support request continue?',
          'Yes',
          '/demo/support/eligibility',
          'whether the fictional support request can continue',
        ),
      ]),
      summaryCard('About you', [
        summaryRow(
          'Fictional full name',
          aboutYou.fullName,
          '/demo/support/about-you',
          'fictional full name',
        ),
        summaryRow(
          'Date of birth',
          formatDateOfBirth(aboutYou.dateOfBirth),
          '/demo/support/about-you',
          'date of birth',
        ),
        summaryRow(
          'Current country',
          optionText(demoSupportCountries, aboutYou.country),
          '/demo/support/about-you',
          'current country',
        ),
      ]),
      summaryCard('Support needs', [
        summaryRow(
          'Types of support',
          formatSupportTypes(supportNeeds.supportTypes),
          '/demo/support/support-needs',
          'types of support',
        ),
        summaryRow(
          'Description',
          supportNeeds.description,
          '/demo/support/support-needs',
          'description of the fictional support needed',
        ),
        summaryRow(
          'Additional information',
          supportNeeds.additionalInformation || 'Not provided',
          '/demo/support/support-needs',
          'additional information',
        ),
      ]),
      summaryCard('Evidence', [
        summaryRow(
          'Supporting document',
          evidence.filename || 'No file selected',
          '/demo/support/evidence',
          'supporting document',
        ),
      ]),
    ],
    formAction: '/demo/support/check-answers',
    submitButton: {
      text: 'Submit fictional request',
    },
  };
}

module.exports = {
  formatDateOfBirth,
  formatSupportTypes,
  supportCheckAnswersPageViewModel,
};
