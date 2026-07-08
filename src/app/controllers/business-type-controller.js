const journeyService = require('../services/journey-service');
const { validateBusinessType } = require('../validators/business-type-validator');
const { businessTypePageViewModel } = require('../view-models/business-type-page-view-model');

function showBusinessType(req, res) {
  const answers = journeyService.getAnswers(req.session);
  res.render('pages/business-type.njk', businessTypePageViewModel({ answers }));
}

function submitBusinessType(req, res) {
  const validation = validateBusinessType(req.body.hasFarmingBusiness);
  const answers = journeyService.getAnswers(req.session);

  if (!validation.isValid) {
    return res.status(400).render(
      'pages/business-type.njk',
      businessTypePageViewModel({
        answers,
        errors: validation.errors,
      }),
    );
  }

  journeyService.saveBranchAnswer(req.session, validation.value);
  return res.redirect(journeyService.getNextPath('businessType', req.session));
}

module.exports = {
  showBusinessType,
  submitBusinessType,
};
