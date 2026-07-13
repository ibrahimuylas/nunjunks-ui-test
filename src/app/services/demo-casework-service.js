const { demoCaseworkRecords } = require('../config/demo-casework-records');
const demoSessionService = require('./demo-session-service');

function ensureRecords(session) {
  const state = demoSessionService.getCaseworkState(session);

  if (!Object.hasOwn(state.values, 'records')) {
    demoSessionService.saveCaseworkValue(session, 'records', demoCaseworkRecords);
  }
}

function getState(session) {
  ensureRecords(session);
  return demoSessionService.getCaseworkState(session);
}

function getRecords(session) {
  return getState(session).values.records;
}

function reset(session) {
  demoSessionService.resetCasework(session);
}

module.exports = { getRecords, getState, reset };
