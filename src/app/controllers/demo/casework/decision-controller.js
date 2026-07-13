const { URLSearchParams } = require('node:url');
const journeyService = require('../../../services/journey-service');
const { validateDecision } = require('../../../validators/demo/casework/decision-validator');
const {
  caseworkDecisionOutcomePageViewModel,
  caseworkDecisionPageViewModel,
} = require('../../../view-models/demo/casework/decision-page-view-model');

const decisionQueryParameters = new Set(['tab', 'page']);

function requestPath(reference, suffix) {
  return `/demo/casework/requests/${encodeURIComponent(reference)}/decision${suffix}`;
}

function contextPath(path, queueContext) {
  const query = new URLSearchParams({
    tab: queueContext.tab,
    page: String(queueContext.page),
  });
  return `${path}?${query}`;
}

function hasUnknownQueryParameter(query) {
  return Object.keys(query).some((parameter) => !decisionQueryParameters.has(parameter));
}

function hasExactContext(query, queueContext) {
  return (
    !hasUnknownQueryParameter(query) &&
    query.tab === queueContext.tab &&
    query.page === String(queueContext.page)
  );
}

function getRequest(req) {
  return journeyService.getDemoCaseworkRequest(
    req.session,
    req.params.reference,
    req.query.tab,
    req.query.page,
  );
}

function showDecision(req, res, next) {
  const request = getRequest(req);

  if (!request) {
    return next();
  }

  const path = requestPath(request.record.reference, '');

  if (request.requiresCanonicalRedirect || hasUnknownQueryParameter(req.query)) {
    return res.redirect(contextPath(path, request.queueContext));
  }

  return res.render('demo/casework/decision.njk', caseworkDecisionPageViewModel(request));
}

function submitDecision(req, res, next) {
  const request = getRequest(req);

  if (!request) {
    return next();
  }

  const validation = validateDecision(req.body);

  if (!validation.isValid) {
    return res.status(400).render(
      'demo/casework/decision.njk',
      caseworkDecisionPageViewModel({
        ...request,
        values: validation.value,
        errors: validation.errors,
      }),
    );
  }

  const savedDecision = journeyService.saveDemoCaseworkDecision(
    req.session,
    request.record.reference,
    validation.value,
    request.queueContext.tab,
    request.queueContext.page,
  );
  const outcomePath = requestPath(savedDecision.record.reference, '/outcome');

  return res.redirect(contextPath(outcomePath, savedDecision.queueContext));
}

function showDecisionOutcome(req, res, next) {
  const outcome = journeyService.getDemoCaseworkDecisionOutcome(req.session, req.params.reference);

  if (!outcome) {
    return next();
  }

  const path = requestPath(outcome.record.reference, '/outcome');

  if (!hasExactContext(req.query, outcome.queueContext)) {
    return res.redirect(contextPath(path, outcome.queueContext));
  }

  return res.render(
    'demo/casework/decision-outcome.njk',
    caseworkDecisionOutcomePageViewModel(outcome),
  );
}

module.exports = { showDecision, showDecisionOutcome, submitDecision };
