const path = require('path');

const evidenceUploadLimits = Object.freeze({
  maxFileSizeBytes: 2 * 1024 * 1024,
  maxFileSizeLabel: '2 MB',
  maxFilenameLength: 255,
});

const evidenceFileTypes = Object.freeze([
  Object.freeze({ extension: '.pdf', mimeType: 'application/pdf' }),
  Object.freeze({ extension: '.jpg', mimeType: 'image/jpeg' }),
  Object.freeze({ extension: '.jpeg', mimeType: 'image/jpeg' }),
  Object.freeze({ extension: '.png', mimeType: 'image/png' }),
]);

const evidenceFileTypeLabel = 'PDF, JPG or PNG';
const evidenceFileAccept = evidenceFileTypes
  .flatMap(({ extension, mimeType }) => [extension, mimeType])
  .filter((value, index, values) => values.indexOf(value) === index)
  .join(',');

function evidenceError(text) {
  return {
    evidence: {
      text,
      href: '#evidence',
    },
  };
}

function sanitizeEvidenceFilename(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const basename = path.posix.basename(value.replaceAll('\\', '/'));

  return basename
    .replace(/[\p{Cc}\p{Cf}]/gu, '')
    .replace(/[^\p{L}\p{N} ._()-]/gu, '_')
    .replace(/\s+/g, ' ')
    .replace(/^\.+/, '')
    .trim();
}

function isAllowedEvidenceType(filename, mimeType) {
  const extension = path.extname(filename).toLowerCase();

  return evidenceFileTypes.some(
    (fileType) => fileType.extension === extension && fileType.mimeType === mimeType,
  );
}

function validateEvidence(file) {
  if (file === undefined) {
    return {
      isValid: true,
      value: { filename: null },
      errors: {},
    };
  }

  const filename = sanitizeEvidenceFilename(file.originalname);
  const hasValidMetadata =
    filename.length > 0 &&
    filename.length <= evidenceUploadLimits.maxFilenameLength &&
    typeof file.mimetype === 'string' &&
    Number.isSafeInteger(file.size) &&
    file.size >= 0;

  if (!hasValidMetadata) {
    return {
      isValid: false,
      value: { filename: null },
      errors: evidenceError('The selected file could not be read. Choose another file'),
    };
  }

  if (file.size > evidenceUploadLimits.maxFileSizeBytes) {
    return {
      isValid: false,
      value: { filename: null },
      errors: evidenceError(
        `The selected file must be ${evidenceUploadLimits.maxFileSizeLabel} or smaller`,
      ),
    };
  }

  if (!isAllowedEvidenceType(filename, file.mimetype)) {
    return {
      isValid: false,
      value: { filename: null },
      errors: evidenceError(`The selected file must be a ${evidenceFileTypeLabel}`),
    };
  }

  return {
    isValid: true,
    value: { filename },
    errors: {},
  };
}

function evidenceParserErrors(error) {
  if (error && error.code === 'LIMIT_FILE_SIZE') {
    return evidenceError(
      `The selected file must be ${evidenceUploadLimits.maxFileSizeLabel} or smaller`,
    );
  }

  return evidenceError('The selected file could not be uploaded. Try again');
}

module.exports = {
  evidenceFileAccept,
  evidenceFileTypeLabel,
  evidenceFileTypes,
  evidenceParserErrors,
  evidenceUploadLimits,
  sanitizeEvidenceFilename,
  validateEvidence,
};
