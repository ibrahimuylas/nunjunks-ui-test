const journeyService = require('../../../services/journey-service');
const { validateAboutYou } = require('../../../validators/demo/support/about-you-validator');
const {
  supportAboutYouPageViewModel,
} = require('../../../view-models/demo/support/about-you-page-view-model');

function getSavedAboutYou(session) {
  return journeyService.getDemoSupportState(session).values.aboutYou || {};
}

function showAboutYou(req, res) {
  journeyService.markDemoSupportStepVisited(req.session, 'aboutYou');

  return res.render(
    'demo/support/about-you.njk',
    supportAboutYouPageViewModel({ values: getSavedAboutYou(req.session) }),
  );
}

function submitAboutYou(req, res) {
  journeyService.markDemoSupportStepVisited(req.session, 'aboutYou');
  const validation = validateAboutYou(req.body);

  if (!validation.isValid) {
    return res.status(400).render(
      'demo/support/about-you.njk',
      supportAboutYouPageViewModel({
        values: validation.value,
        errors: validation.errors,
      }),
    );
  }

  journeyService.completeDemoSupportAboutYou(req.session, validation.value);
  return res.redirect('/demo/support/tasks');
}

module.exports = { showAboutYou, submitAboutYou };
