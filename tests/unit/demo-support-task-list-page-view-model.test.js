const {
  supportTaskListPageViewModel,
} = require('../../src/app/view-models/demo/support/task-list-page-view-model');

const mixedTasks = [
  {
    key: 'aboutYou',
    title: 'About you',
    hint: 'Enter fictional personal details',
    path: '/demo/support/about-you',
    status: 'completed',
    available: true,
  },
  {
    key: 'supportNeeds',
    title: 'Support needs',
    path: '/demo/support/support-needs',
    status: 'in-progress',
    available: true,
  },
  {
    key: 'evidence',
    title: 'Evidence',
    path: '/demo/support/evidence',
    status: 'not-started',
    available: true,
  },
  {
    key: 'checkAnswers',
    title: 'Check your answers',
    path: '/demo/support/check-answers',
    status: 'cannot-start-yet',
    available: false,
  },
];

describe('demo support task-list page view model', () => {
  test('maps every domain status to a GOV.UK tag and locks unavailable tasks', () => {
    const model = supportTaskListPageViewModel({ tasks: mixedTasks });

    expect(model.taskList.items.map((item) => ({ href: item.href, tag: item.status.tag }))).toEqual(
      [
        {
          href: '/demo/support/about-you',
          tag: { text: 'Completed', classes: 'govuk-tag--green' },
        },
        {
          href: '/demo/support/support-needs',
          tag: { text: 'In progress', classes: 'govuk-tag--light-blue' },
        },
        {
          href: '/demo/support/evidence',
          tag: { text: 'Not started', classes: 'govuk-tag--blue' },
        },
        {
          href: undefined,
          tag: { text: 'Cannot start yet', classes: 'govuk-tag--grey' },
        },
      ],
    );
    expect(model.taskList.items[0].hint).toEqual({
      text: 'Enter fictional personal details',
    });
  });

  test('links check answers as soon as its service state is available', () => {
    const checkAnswers = {
      ...mixedTasks[3],
      status: 'not-started',
      available: true,
    };
    const model = supportTaskListPageViewModel({ tasks: [checkAnswers] });

    expect(model.taskList.items[0]).toMatchObject({
      title: { text: 'Check your answers' },
      href: '/demo/support/check-answers',
      status: {
        tag: { text: 'Not started', classes: 'govuk-tag--blue' },
      },
    });
  });

  test('rejects an unknown task status instead of rendering an empty tag', () => {
    expect(() =>
      supportTaskListPageViewModel({
        tasks: [{ ...mixedTasks[0], status: 'unknown' }],
      }),
    ).toThrow('Demo support task status must be allow-listed');
  });

  test('prepares public shell and back navigation options', () => {
    const model = supportTaskListPageViewModel();

    expect(model.pageTitle).toBe('Application tasks');
    expect(model.heading).toBe('Application tasks');
    expect(model.backLink).toEqual({
      text: 'Back',
      href: '/demo/support/eligibility',
    });
    expect(model.serviceNavigation.navigation).toContainEqual(
      expect.objectContaining({ text: 'Public journey', active: true }),
    );
    expect(model.taskList).toEqual({ idPrefix: 'support-task', items: [] });
  });
});
