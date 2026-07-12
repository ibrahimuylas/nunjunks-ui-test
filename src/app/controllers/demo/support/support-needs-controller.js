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

function pageViewModelOptions(session, { values, errors, change }) {
  return {
    values,
    errors,
    ...(change
      ? {
          backLinkHref: journeyService.getDemoSupportChangeReturnPath('supportNeeds', session),
          formAction: journeyService.getDemoSupportChangePath('supportNeeds'),
        }
      : {}),
  };
}

function show(req, res, { change = false } = {}) {
  journeyService.markDemoSupportStepVisited(req.session, 'supportNeeds');

  return res.render(
    'demo/support/support-needs.njk',
    supportNeedsPageViewModel(
      pageViewModelOptions(req.session, {
        values: getSavedSupportNeeds(req.session),
        change,
      }),
    ),
  );
}

function submit(req, res, { change = false } = {}) {
  journeyService.markDemoSupportStepVisited(req.session, 'supportNeeds');
  const validation = validateSupportNeeds(req.body);

  if (!validation.isValid) {
    return res.status(400).render(
      'demo/support/support-needs.njk',
      supportNeedsPageViewModel(
        pageViewModelOptions(req.session, {
          values: validation.value,
          errors: validation.errors,
          change,
        }),
      ),
    );
  }

  journeyService.completeDemoSupportNeeds(req.session, validation.value);
  return res.redirect(
    change
      ? journeyService.getDemoSupportChangeReturnPath('supportNeeds', req.session)
      : '/demo/support/tasks',
  );
}

function showSupportNeeds(req, res) {
  return show(req, res);
}

function showSupportNeedsChange(req, res) {
  return show(req, res, { change: true });
}

function submitSupportNeeds(req, res) {
  return submit(req, res);
}

function submitSupportNeedsChange(req, res) {
  return submit(req, res, { change: true });
}

module.exports = {
  showSupportNeeds,
  showSupportNeedsChange,
  submitSupportNeeds,
  submitSupportNeedsChange,
};
