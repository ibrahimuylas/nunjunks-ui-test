const journeyService = require('../../../services/journey-service');
const {
  supportCheckAnswersPageViewModel,
} = require('../../../view-models/demo/support/check-answers-page-view-model');

function showCheckAnswers(req, res) {
  journeyService.markDemoSupportStepVisited(req.session, 'checkAnswers');

  return res.render(
    'demo/support/check-answers.njk',
    supportCheckAnswersPageViewModel({
      values: journeyService.getDemoSupportState(req.session).values,
    }),
  );
}

module.exports = { showCheckAnswers };
