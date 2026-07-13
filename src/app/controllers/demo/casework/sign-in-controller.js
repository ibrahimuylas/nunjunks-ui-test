const journeyService = require('../../../services/journey-service');
const { validateSignIn } = require('../../../validators/demo/casework/sign-in-validator');
const {
  caseworkSignInPageViewModel,
} = require('../../../view-models/demo/casework/sign-in-page-view-model');

const queuePath = '/demo/casework/queue';

function showSignIn(req, res) {
  if (journeyService.getDemoCaseworkAccessRedirect(req.session) === null) {
    return res.redirect(queuePath);
  }

  return res.render('demo/casework/sign-in.njk', caseworkSignInPageViewModel());
}

function submitSignIn(req, res) {
  const validation = validateSignIn(req.body.password);

  if (!validation.isValid) {
    return res
      .status(400)
      .render('demo/casework/sign-in.njk', caseworkSignInPageViewModel(validation));
  }

  journeyService.grantDemoCaseworkAccess(req.session);
  return res.redirect(queuePath);
}

function requireCaseworkAccess(req, res, next) {
  const accessRedirect = journeyService.getDemoCaseworkAccessRedirect(req.session);

  if (accessRedirect) {
    return res.redirect(accessRedirect);
  }

  return next();
}

module.exports = { requireCaseworkAccess, showSignIn, submitSignIn };
