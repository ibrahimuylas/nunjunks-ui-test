const { URLSearchParams } = require('node:url');
const journeyService = require('../../../services/journey-service');
const {
  caseworkQueuePageViewModel,
} = require('../../../view-models/demo/casework/queue-page-view-model');

const queuePath = '/demo/casework/queue';
const queueQueryParameters = new Set(['tab', 'page']);

function showQueue(req, res) {
  const queue = journeyService.getDemoCaseworkQueue(req.session, req.query.tab, req.query.page);
  const hasUnknownQueryParameter = Object.keys(req.query).some(
    (parameter) => !queueQueryParameters.has(parameter),
  );

  if (queue.requiresCanonicalRedirect || hasUnknownQueryParameter) {
    const query = new URLSearchParams({
      tab: queue.selectedTab,
      page: String(queue.selectedPage),
    });

    return res.redirect(`${queuePath}?${query}`);
  }

  return res.render('demo/casework/queue.njk', caseworkQueuePageViewModel(queue));
}

module.exports = { showQueue };
