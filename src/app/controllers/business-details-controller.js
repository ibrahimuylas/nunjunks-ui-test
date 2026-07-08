const journeyService = require('../services/journey-service');
const { validateBusinessDetails } = require('../validators/business-details-validator');
const { businessDetailsPageViewModel } = require('../view-models/business-details-page-view-model');

function showBusinessDetails(req, res) {
  if (!journeyService.hasAnswer(req.session, 'hasFarmingBusiness')) {
    return res.redirect('/business-type');
  }

  if (journeyService.getAnswers(req.session).hasFarmingBusiness === 'no') {
    return res.redirect('/full-name');
  }

  const answers = journeyService.getAnswers(req.session);
  return res.render('pages/business-details.njk', businessDetailsPageViewModel({ answers }));
}

function submitBusinessDetails(req, res) {
  if (!journeyService.hasAnswer(req.session, 'hasFarmingBusiness')) {
    return res.redirect('/business-type');
  }

  if (journeyService.getAnswers(req.session).hasFarmingBusiness === 'no') {
    return res.redirect('/full-name');
  }

  const validation = validateBusinessDetails(req.body.businessName);
  const answers = journeyService.getAnswers(req.session);

  if (!validation.isValid) {
    return res.status(400).render(
      'pages/business-details.njk',
      businessDetailsPageViewModel({
        answers: { ...answers, businessName: req.body.businessName },
        errors: validation.errors,
      }),
    );
  }

  journeyService.saveAnswer(req.session, 'businessName', validation.value);
  return res.redirect(journeyService.getNextPath('businessDetails', req.session));
}

module.exports = {
  showBusinessDetails,
  submitBusinessDetails,
};
