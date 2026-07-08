function formatReceiveUpdates(value) {
  return value === 'yes' ? 'Yes' : 'No';
}

function formatYesNo(value) {
  return value === 'yes' ? 'Yes' : 'No';
}

function formatDateOfBirth(dateOfBirth) {
  return `${dateOfBirth.day} ${dateOfBirth.month} ${dateOfBirth.year}`;
}

function checkAnswersPageViewModel({ answers }) {
  const rows = [
    {
      key: { text: 'Do you have a farming business?' },
      value: { text: formatYesNo(answers.hasFarmingBusiness) },
      actions: {
        items: [
          {
            href: '/business-type',
            text: 'Change',
            visuallyHiddenText: 'whether you have a farming business',
          },
        ],
      },
    },
  ];

  if (answers.hasFarmingBusiness === 'yes') {
    rows.push({
      key: { text: 'Business name' },
      value: { text: answers.businessName },
      actions: {
        items: [
          {
            href: '/business-details',
            text: 'Change',
            visuallyHiddenText: 'business name',
          },
        ],
      },
    });
  }

  if (answers.hasFarmingBusiness === 'no') {
    rows.push(
      {
        key: { text: 'Full name' },
        value: { text: answers.fullName },
        actions: {
          items: [
            {
              href: '/full-name',
              text: 'Change',
              visuallyHiddenText: 'full name',
            },
          ],
        },
      },
      {
        key: { text: 'Date of birth' },
        value: { text: formatDateOfBirth(answers.dateOfBirth) },
        actions: {
          items: [
            {
              href: '/full-name',
              text: 'Change',
              visuallyHiddenText: 'date of birth',
            },
          ],
        },
      },
    );
  }

  rows.push({
    key: { text: 'Receive updates' },
    value: { text: formatReceiveUpdates(answers.receiveUpdates) },
    actions: {
      items: [
        {
          href: '/updates',
          text: 'Change',
          visuallyHiddenText: 'whether you want to receive updates',
        },
      ],
    },
  });

  return {
    pageTitle: 'Check your answers',
    summaryList: {
      rows,
    },
  };
}

module.exports = { checkAnswersPageViewModel, formatDateOfBirth, formatReceiveUpdates, formatYesNo };
