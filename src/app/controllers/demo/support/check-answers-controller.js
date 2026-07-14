const journeyService = require('../../../services/journey-service');
const {
  supportCheckAnswersPageViewModel,
} = require('../../../view-models/demo/support/check-answers-page-view-model');
const {
  supportConfirmationPageViewModel,
} = require('../../../view-models/demo/support/confirmation-page-view-model');

function showCheckAnswers(req, res) {
  journeyService.markDemoSupportStepVisited(req.session, 'checkAnswers');

  return res.render(
    'demo/support/check-answers.njk',
    supportCheckAnswersPageViewModel({
      values: journeyService.getDemoSupportState(req.session).values,
    }),
  );
}

function submitCheckAnswers(req, res) {
  const submission = journeyService.submitDemoSupportRequest(req.session);

  if (!submission.submitted) {
    return res.redirect(submission.redirectPath);
  }

  return res.redirect('/demo/support/confirmation');
}

function showConfirmation(req, res) {
  const redirectPath = journeyService.getDemoSupportConfirmationAccessRedirect(req.session);

  if (redirectPath) {
    return res.redirect(redirectPath);
  }

  return res.render(
    'demo/support/confirmation.njk',
    supportConfirmationPageViewModel({
      reference: journeyService.getDemoSupportState(req.session).values.reference,
    }),
  );
}

function startAnotherSupportRequest(req, res) {
  journeyService.resetDemoSupport(req.session);
  return res.redirect('/demo/support/start');
}

module.exports = {
  showCheckAnswers,
  showConfirmation,
  startAnotherSupportRequest,
  submitCheckAnswers,
};
