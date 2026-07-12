const journeyService = require('../../../services/journey-service');
const { validateAboutYou } = require('../../../validators/demo/support/about-you-validator');
const {
  supportAboutYouPageViewModel,
} = require('../../../view-models/demo/support/about-you-page-view-model');

function getSavedAboutYou(session) {
  return journeyService.getDemoSupportState(session).values.aboutYou || {};
}

function pageViewModelOptions(session, { values, errors, change }) {
  return {
    values,
    errors,
    ...(change
      ? {
          backLinkHref: journeyService.getDemoSupportChangeReturnPath('aboutYou', session),
          formAction: journeyService.getDemoSupportChangePath('aboutYou'),
        }
      : {}),
  };
}

function show(req, res, { change = false } = {}) {
  journeyService.markDemoSupportStepVisited(req.session, 'aboutYou');

  return res.render(
    'demo/support/about-you.njk',
    supportAboutYouPageViewModel(
      pageViewModelOptions(req.session, {
        values: getSavedAboutYou(req.session),
        change,
      }),
    ),
  );
}

function submit(req, res, { change = false } = {}) {
  journeyService.markDemoSupportStepVisited(req.session, 'aboutYou');
  const validation = validateAboutYou(req.body);

  if (!validation.isValid) {
    return res.status(400).render(
      'demo/support/about-you.njk',
      supportAboutYouPageViewModel(
        pageViewModelOptions(req.session, {
          values: validation.value,
          errors: validation.errors,
          change,
        }),
      ),
    );
  }

  journeyService.completeDemoSupportAboutYou(req.session, validation.value);
  return res.redirect(
    change
      ? journeyService.getDemoSupportChangeReturnPath('aboutYou', req.session)
      : '/demo/support/tasks',
  );
}

function showAboutYou(req, res) {
  return show(req, res);
}

function showAboutYouChange(req, res) {
  return show(req, res, { change: true });
}

function submitAboutYou(req, res) {
  return submit(req, res);
}

function submitAboutYouChange(req, res) {
  return submit(req, res, { change: true });
}

module.exports = {
  showAboutYou,
  showAboutYouChange,
  submitAboutYou,
  submitAboutYouChange,
};
