const {
  demoCaseworkPageSize,
  demoCaseworkRecords,
  demoCaseworkTabs,
} = require('../config/demo-casework-records');
const demoSessionService = require('./demo-session-service');

const signInPath = '/demo/casework/sign-in';
const defaultQueueTab = demoCaseworkTabs[0];

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

function normalizeQueueTab(tab) {
  return typeof tab === 'string' && demoCaseworkTabs.includes(tab) ? tab : defaultQueueTab;
}

function normalizeRequestedPage(requestedPage, pageCount) {
  const isStringInteger = typeof requestedPage === 'string' && /^[1-9]\d*$/.test(requestedPage);
  const isNumberInteger = Number.isSafeInteger(requestedPage) && requestedPage > 0;
  const parsedPage = isStringInteger ? Number(requestedPage) : requestedPage;
  const isPositiveSafeInteger =
    (isStringInteger || isNumberInteger) && Number.isSafeInteger(parsedPage);

  if (!isPositiveSafeInteger) {
    return {
      currentPage: 1,
      requiresCanonicalRedirect: requestedPage !== undefined,
    };
  }

  return {
    currentPage: Math.min(parsedPage, pageCount),
    requiresCanonicalRedirect: parsedPage > pageCount,
  };
}

function paginateRecords(records, requestedPage) {
  const pageCount = Math.max(1, Math.ceil(records.length / demoCaseworkPageSize));
  const { currentPage, requiresCanonicalRedirect } = normalizeRequestedPage(
    requestedPage,
    pageCount,
  );
  const firstRecordIndex = (currentPage - 1) * demoCaseworkPageSize;

  return {
    records: records.slice(firstRecordIndex, firstRecordIndex + demoCaseworkPageSize),
    pagination: {
      currentPage,
      pageCount,
      totalRecords: records.length,
    },
    requiresCanonicalRedirect,
  };
}

function getQueue(session, requestedTab, requestedPage) {
  const selectedTab = normalizeQueueTab(requestedTab);
  const records = getRecords(session);
  const tabs = demoCaseworkTabs.map((tab) => {
    const filteredRecords = records.filter((record) => record.queue === tab);

    return {
      key: tab,
      ...paginateRecords(filteredRecords, tab === selectedTab ? requestedPage : undefined),
    };
  });
  const selectedQueue = tabs.find((tab) => tab.key === selectedTab);

  return {
    selectedTab,
    selectedPage: selectedQueue.pagination.currentPage,
    tabs,
    requiresCanonicalRedirect:
      (requestedTab !== undefined && requestedTab !== selectedTab) ||
      selectedQueue.requiresCanonicalRedirect,
  };
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

module.exports = {
  getAccessRedirect,
  getQueue,
  getRecords,
  getState,
  grantAccess,
  hasAccess,
  reset,
};
