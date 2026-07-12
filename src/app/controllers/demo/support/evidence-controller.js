const multer = require('multer');
const journeyService = require('../../../services/journey-service');
const {
  evidenceParserErrors,
  evidenceUploadLimits,
  validateEvidence,
} = require('../../../validators/demo/support/evidence-validator');
const {
  supportEvidencePageViewModel,
} = require('../../../view-models/demo/support/evidence-page-view-model');

// This storage engine drains each chunk so multipart limits can be enforced,
// but never accumulates file bytes in memory or writes them to a filesystem.
const discardStorage = {
  _handleFile(req, file, callback) {
    let size = 0;

    file.stream.on('data', (chunk) => {
      size += chunk.length;
    });
    file.stream.on('end', () => callback(null, { size }));
  },
  _removeFile(req, file, callback) {
    callback(null);
  },
};

const evidenceUpload = multer({
  storage: discardStorage,
  limits: {
    fileSize: evidenceUploadLimits.maxFileSizeBytes,
    files: 1,
    fields: 0,
    // Busboy emits its parts-limit event at the boundary, so 2 permits exactly 1 part.
    parts: 2,
  },
}).single('evidence');

function getSavedEvidence(session) {
  return journeyService.getDemoSupportState(session).values.evidence || {};
}

function pageViewModelOptions(session, { values, errors, change }) {
  return {
    values,
    errors,
    ...(change
      ? {
          backLinkHref: journeyService.getDemoSupportChangeReturnPath('evidence', session),
          formAction: journeyService.getDemoSupportChangePath('evidence'),
        }
      : {}),
  };
}

function renderEvidenceError(req, res, errors, { change = false } = {}) {
  return res.status(400).render(
    'demo/support/evidence.njk',
    supportEvidencePageViewModel(
      pageViewModelOptions(req.session, {
        values: getSavedEvidence(req.session),
        errors,
        change,
      }),
    ),
  );
}

function show(req, res, { change = false } = {}) {
  journeyService.markDemoSupportStepVisited(req.session, 'evidence');

  return res.render(
    'demo/support/evidence.njk',
    supportEvidencePageViewModel(
      pageViewModelOptions(req.session, {
        values: getSavedEvidence(req.session),
        change,
      }),
    ),
  );
}

function parseUpload(req, res, next, { change = false } = {}) {
  journeyService.markDemoSupportStepVisited(req.session, 'evidence');

  return evidenceUpload(req, res, (error) => {
    if (error) {
      return renderEvidenceError(req, res, evidenceParserErrors(error), { change });
    }

    return next();
  });
}

function submit(req, res, { change = false } = {}) {
  const validation = validateEvidence(req.file);
  delete req.file;

  if (!validation.isValid) {
    return renderEvidenceError(req, res, validation.errors, { change });
  }

  journeyService.completeDemoSupportEvidence(req.session, validation.value);
  return res.redirect(
    change
      ? journeyService.getDemoSupportChangeReturnPath('evidence', req.session)
      : '/demo/support/tasks',
  );
}

function showEvidence(req, res) {
  return show(req, res);
}

function showEvidenceChange(req, res) {
  return show(req, res, { change: true });
}

function parseEvidenceUpload(req, res, next) {
  return parseUpload(req, res, next);
}

function parseEvidenceChangeUpload(req, res, next) {
  return parseUpload(req, res, next, { change: true });
}

function submitEvidence(req, res) {
  return submit(req, res);
}

function submitEvidenceChange(req, res) {
  return submit(req, res, { change: true });
}

module.exports = {
  parseEvidenceChangeUpload,
  parseEvidenceUpload,
  showEvidence,
  showEvidenceChange,
  submitEvidence,
  submitEvidenceChange,
};
