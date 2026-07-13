const { demoCaseworkRecords } = require('../config/demo-casework-records');
const demoSessionService = require('./demo-session-service');

const signInPath = '/demo/casework/sign-in';

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

function grantAccess(session) {
  demoSessionService.saveCaseworkCompletion(session, 'signedIn', true);
}

function hasAccess(session) {
  return demoSessionService.getCaseworkState(session).completion.signedIn === true;
}

function getAccessRedirect(session) {
  return hasAccess(session) ? null : signInPath;
}

function reset(session) {
  demoSessionService.resetCasework(session);
}

module.exports = { getAccessRedirect, getRecords, getState, grantAccess, hasAccess, reset };
