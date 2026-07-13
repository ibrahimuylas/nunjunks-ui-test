const { URLSearchParams } = require('node:url');
const journeyService = require('../../../services/journey-service');
const {
  caseworkRequestPageViewModel,
} = require('../../../view-models/demo/casework/request-page-view-model');

const requestQueryParameters = new Set(['tab', 'page']);

function showRequest(req, res, next) {
  const request = journeyService.getDemoCaseworkRequest(
    req.session,
    req.params.reference,
    req.query.tab,
    req.query.page,
  );

  if (!request) {
    return next();
  }

  const hasUnknownQueryParameter = Object.keys(req.query).some(
    (parameter) => !requestQueryParameters.has(parameter),
  );

  if (request.requiresCanonicalRedirect || hasUnknownQueryParameter) {
    const query = new URLSearchParams({
      tab: request.queueContext.tab,
      page: String(request.queueContext.page),
    });
    const requestPath = `/demo/casework/requests/${encodeURIComponent(request.record.reference)}`;

    return res.redirect(`${requestPath}?${query}`);
  }

  return res.render('demo/casework/request.njk', caseworkRequestPageViewModel(request));
}

module.exports = { showRequest };
