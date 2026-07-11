const { demoShellViewModel } = require('../shell-view-model');
const { demoSupportTaskStatuses } = require('../../../config/demo-support-steps');

const taskStatusOptions = Object.freeze({
  [demoSupportTaskStatuses.notStarted]: Object.freeze({
    text: 'Not started',
    classes: 'govuk-tag--blue',
  }),
  [demoSupportTaskStatuses.inProgress]: Object.freeze({
    text: 'In progress',
    classes: 'govuk-tag--light-blue',
  }),
  [demoSupportTaskStatuses.completed]: Object.freeze({
    text: 'Completed',
    classes: 'govuk-tag--green',
  }),
  [demoSupportTaskStatuses.cannotStartYet]: Object.freeze({
    text: 'Cannot start yet',
    classes: 'govuk-tag--grey',
  }),
});

function taskListItemViewModel(task) {
  const status = taskStatusOptions[task.status];

  if (!status) {
    throw new TypeError('Demo support task status must be allow-listed');
  }

  const item = {
    title: { text: task.title },
    status: {
      tag: status,
    },
  };

  if (task.hint) {
    item.hint = { text: task.hint };
  }

  if (task.available) {
    item.href = task.path;
  }

  return item;
}

function supportTaskListPageViewModel({ tasks = [] } = {}) {
  return {
    ...demoShellViewModel({
      pageTitle: 'Application tasks',
      navigationSection: 'support',
    }),
    backLink: {
      text: 'Back',
      href: '/demo/support/eligibility',
    },
    heading: 'Application tasks',
    taskList: {
      idPrefix: 'support-task',
      items: tasks.map(taskListItemViewModel),
    },
  };
}

module.exports = { supportTaskListPageViewModel };
