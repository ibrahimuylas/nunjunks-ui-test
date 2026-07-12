const journeyService = require('../../../services/journey-service');
const {
  validateSupportNeeds,
} = require('../../../validators/demo/support/support-needs-validator');
const {
  supportNeedsPageViewModel,
} = require('../../../view-models/demo/support/support-needs-page-view-model');

function getSavedSupportNeeds(session) {
  return journeyService.getDemoSupportState(session).values.supportNeeds || {};
}

function showSupportNeeds(req, res) {
  journeyService.markDemoSupportStepVisited(req.session, 'supportNeeds');

  return res.render(
    'demo/support/support-needs.njk',
    supportNeedsPageViewModel({ values: getSavedSupportNeeds(req.session) }),
  );
}

function submitSupportNeeds(req, res) {
  journeyService.markDemoSupportStepVisited(req.session, 'supportNeeds');
  const validation = validateSupportNeeds(req.body);

  if (!validation.isValid) {
    return res.status(400).render(
      'demo/support/support-needs.njk',
      supportNeedsPageViewModel({
        values: validation.value,
        errors: validation.errors,
      }),
    );
  }

  journeyService.completeDemoSupportNeeds(req.session, validation.value);
  return res.redirect('/demo/support/tasks');
}

module.exports = { showSupportNeeds, submitSupportNeeds };
