const demoSessionService = require('../../services/demo-session-service');
const { demoShellViewModel } = require('../../view-models/demo/shell-view-model');

function showHome(req, res) {
  res.render(
    'demo/pages/home.njk',
    demoShellViewModel({
      pageTitle: 'Choose a fictional service journey',
      navigationSection: 'home',
    }),
  );
}

function resetSupport(req, res) {
  demoSessionService.resetSupport(req.session);
  return res.redirect('/demo');
}

function resetCasework(req, res) {
  demoSessionService.resetCasework(req.session);
  return res.redirect('/demo');
}

module.exports = { showHome, resetSupport, resetCasework };
