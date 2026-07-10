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

module.exports = { showHome };
