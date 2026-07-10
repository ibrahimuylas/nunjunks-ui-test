const VIEWPORTS = Object.freeze({
  mobile: Object.freeze({ width: 375, height: 667 }),
  desktop: Object.freeze({ width: 1280, height: 720 }),
});

function getViewport(name) {
  const viewport = VIEWPORTS[name];

  if (!viewport) {
    throw new Error(`Unknown browser-test viewport: ${name}`);
  }

  return { ...viewport };
}

module.exports = { getViewport, VIEWPORTS };
