const demoSessionService = require('../../services/demo-session-service');
const { cookieBannerViewModel } = require('../../view-models/demo/shell-view-model');
const { URL } = require('url');

const preferenceByAction = new Map([
  ['accept', 'accepted'],
  ['reject', 'rejected'],
]);

const demoOrigin = 'http://demo.local';

function hasUnsafeReturnPathCharacters(value) {
  for (const character of value) {
    const codePoint = character.codePointAt(0);

    if (character === '\\' || codePoint <= 0x1f || codePoint === 0x7f) {
      return true;
    }
  }

  return false;
}

function normalizeDemoReturnPath(value) {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    hasUnsafeReturnPathCharacters(value)
  ) {
    return '/demo';
  }

  try {
    const destination = new URL(value, demoOrigin);
    const isDemoPath =
      destination.pathname === '/demo' || destination.pathname.startsWith('/demo/');

    if (destination.origin !== demoOrigin || !isDemoPath) {
      return '/demo';
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return '/demo';
  }
}

function addCookieBanner(req, res, next) {
  res.locals.cookieBanner = cookieBannerViewModel({
    ...demoSessionService.getCookiePreferenceState(req.session),
    returnTo: normalizeDemoReturnPath(req.originalUrl),
  });
  next();
}

function updateCookiePreference(req, res) {
  const action = typeof req.body.cookies === 'string' ? req.body.cookies : null;
  const preference = preferenceByAction.get(action);

  if (preference) {
    demoSessionService.saveCookiePreference(req.session, preference);
  } else if (action === 'hide') {
    demoSessionService.hideCookieAcknowledgement(req.session);
  }

  return res.redirect(normalizeDemoReturnPath(req.body.returnTo));
}

module.exports = { addCookieBanner, updateCookiePreference };
