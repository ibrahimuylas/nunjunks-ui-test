const journeyService = require('../../../services/journey-service');
const { validateEligibility } = require('../../../validators/demo/support/eligibility-validator');
const {
  supportEligibilityPageViewModel,
  supportIneligiblePageViewModel,
} = require('../../../view-models/demo/support/eligibility-page-view-model');

function getSavedEligibility(session) {
  return journeyService.getDemoSupportState(session).values.eligibility;
}

function showEligibility(req, res) {
  return res.render(
    'demo/support/eligibility.njk',
    supportEligibilityPageViewModel({ eligibility: getSavedEligibility(req.session) }),
  );
}

function showEligibilityChange(req, res) {
  if (getSavedEligibility(req.session) !== 'ineligible') {
    return res.redirect('/demo/support/eligibility');
  }

  return res.render(
    'demo/support/eligibility.njk',
    supportEligibilityPageViewModel({
      eligibility: getSavedEligibility(req.session),
      change: true,
    }),
  );
}

function submit(req, res, { change = false } = {}) {
  const validation = validateEligibility(req.body.eligibility);

  if (!validation.isValid) {
    return res.status(400).render(
      'demo/support/eligibility.njk',
      supportEligibilityPageViewModel({
        eligibility: req.body.eligibility,
        errors: validation.errors,
        change,
      }),
    );
  }

  journeyService.saveDemoSupportEligibility(req.session, validation.value);
  return res.redirect(journeyService.getDemoSupportNextPath('eligibility', req.session));
}

function submitEligibility(req, res) {
  return submit(req, res);
}

function submitEligibilityChange(req, res) {
  if (getSavedEligibility(req.session) !== 'ineligible') {
    return res.redirect('/demo/support/eligibility');
  }

  return submit(req, res, { change: true });
}

function showIneligible(req, res) {
  if (getSavedEligibility(req.session) !== 'ineligible') {
    return res.redirect(journeyService.getDemoSupportNextPath('eligibility', req.session));
  }

  return res.render('demo/support/ineligible.njk', supportIneligiblePageViewModel());
}

module.exports = {
  showEligibility,
  submitEligibility,
  showEligibilityChange,
  submitEligibilityChange,
  showIneligible,
};
