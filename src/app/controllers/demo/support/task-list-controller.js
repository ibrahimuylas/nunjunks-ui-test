const journeyService = require('../../../services/journey-service');
const {
  supportTaskListPageViewModel,
} = require('../../../view-models/demo/support/task-list-page-view-model');

function requireSupportStep(stepKey) {
  return function requireSupportStepAccess(req, res, next) {
    const redirectPath = journeyService.getDemoSupportAccessRedirect(stepKey, req.session);

    if (redirectPath) {
      return res.redirect(redirectPath);
    }

    return next();
  };
}

function showTaskList(req, res) {
  return res.render(
    'demo/support/task-list.njk',
    supportTaskListPageViewModel({
      tasks: journeyService.getDemoSupportTaskStates(req.session),
    }),
  );
}

module.exports = { requireSupportStep, showTaskList };
