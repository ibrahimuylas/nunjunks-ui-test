const { startPageViewModel } = require('../view-models/start-page-view-model');

function redirectToStart(req, res) {
  res.redirect('/start');
}

function showStart(req, res) {
  res.render('pages/start.njk', startPageViewModel());
}

module.exports = {
  redirectToStart,
  showStart,
};
