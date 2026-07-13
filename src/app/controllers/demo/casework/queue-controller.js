const journeyService = require('../../../services/journey-service');
const {
  caseworkQueuePageViewModel,
} = require('../../../view-models/demo/casework/queue-page-view-model');

function showQueue(req, res) {
  const queue = journeyService.getDemoCaseworkQueue(req.session, req.query.tab);

  return res.render('demo/casework/queue.njk', caseworkQueuePageViewModel(queue));
}

module.exports = { showQueue };
