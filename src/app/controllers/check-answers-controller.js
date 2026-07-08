const journeyService = require('../services/journey-service');
const { checkAnswersPageViewModel } = require('../view-models/check-answers-page-view-model');
const { confirmationPageViewModel } = require('../view-models/confirmation-page-view-model');

function showCheckAnswers(req, res) {
  const missingPath = journeyService.firstMissingAnswerPath(req.session);

  if (missingPath) {
    return res.redirect(missingPath);
  }

  return res.render(
    'pages/check-answers.njk',
    checkAnswersPageViewModel({ answers: journeyService.getAnswers(req.session) }),
  );
}

function submitCheckAnswers(req, res) {
  const missingPath = journeyService.firstMissingAnswerPath(req.session);

  if (missingPath) {
    return res.redirect(missingPath);
  }

  journeyService.markComplete(req.session);
  return res.redirect('/confirmation');
}

function showConfirmation(req, res) {
  if (!journeyService.isComplete(req.session)) {
    return res.redirect('/check-answers');
  }

  res.render('pages/confirmation.njk', confirmationPageViewModel());
}

module.exports = {
  showCheckAnswers,
  submitCheckAnswers,
  showConfirmation,
};
