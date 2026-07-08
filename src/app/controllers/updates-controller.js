const journeyService = require('../services/journey-service');
const { validateUpdates } = require('../validators/updates-validator');
const { updatesPageViewModel } = require('../view-models/updates-page-view-model');

function showUpdates(req, res) {
  const missingPath = journeyService.firstMissingPreviousAnswerPath(req.session, 'updates');

  if (missingPath) {
    return res.redirect(missingPath);
  }

  const answers = journeyService.getAnswers(req.session);
  return res.render(
    'pages/updates.njk',
    updatesPageViewModel({
      answers,
      backLinkHref: journeyService.getPreviousPath('updates', req.session),
    }),
  );
}

function submitUpdates(req, res) {
  const missingPath = journeyService.firstMissingPreviousAnswerPath(req.session, 'updates');

  if (missingPath) {
    return res.redirect(missingPath);
  }

  const validation = validateUpdates(req.body.receiveUpdates);
  const answers = journeyService.getAnswers(req.session);

  if (!validation.isValid) {
    return res.status(400).render(
      'pages/updates.njk',
      updatesPageViewModel({
        answers,
        errors: validation.errors,
        backLinkHref: journeyService.getPreviousPath('updates', req.session),
      }),
    );
  }

  journeyService.saveAnswer(req.session, 'receiveUpdates', validation.value);
  return res.redirect(journeyService.getNextPath('updates', req.session));
}

module.exports = {
  showUpdates,
  submitUpdates,
};
