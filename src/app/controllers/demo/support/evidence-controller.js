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

function renderEvidenceError(req, res, errors) {
  return res.status(400).render(
    'demo/support/evidence.njk',
    supportEvidencePageViewModel({
      values: getSavedEvidence(req.session),
      errors,
    }),
  );
}

function showEvidence(req, res) {
  journeyService.markDemoSupportStepVisited(req.session, 'evidence');

  return res.render(
    'demo/support/evidence.njk',
    supportEvidencePageViewModel({ values: getSavedEvidence(req.session) }),
  );
}

function parseEvidenceUpload(req, res, next) {
  journeyService.markDemoSupportStepVisited(req.session, 'evidence');

  return evidenceUpload(req, res, (error) => {
    if (error) {
      return renderEvidenceError(req, res, evidenceParserErrors(error));
    }

    return next();
  });
}

function submitEvidence(req, res) {
  const validation = validateEvidence(req.file);
  delete req.file;

  if (!validation.isValid) {
    return renderEvidenceError(req, res, validation.errors);
  }

  journeyService.completeDemoSupportEvidence(req.session, validation.value);
  return res.redirect('/demo/support/tasks');
}

module.exports = { parseEvidenceUpload, showEvidence, submitEvidence };
