const {
  supportStartPageViewModel,
} = require('../../../view-models/demo/support/start-page-view-model');

function showStart(req, res) {
  res.render('demo/support/start.njk', supportStartPageViewModel());
}

module.exports = { showStart };
