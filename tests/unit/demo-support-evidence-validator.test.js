const { Buffer } = require('node:buffer');
const {
  evidenceParserErrors,
  evidenceUploadLimits,
  sanitizeEvidenceFilename,
  validateEvidence,
} = require('../../src/app/validators/demo/support/evidence-validator');

function fileMetadata(overrides = {}) {
  return {
    originalname: 'fictional-evidence.pdf',
    mimetype: 'application/pdf',
    size: 1024,
    ...overrides,
  };
}

describe('demo support evidence validator', () => {
  test('explicitly completes the optional section when no file is selected', () => {
    expect(validateEvidence()).toEqual({
      isValid: true,
      value: { filename: null },
      errors: {},
    });
  });

  test.each([
    ['PDF', 'fictional-evidence.pdf', 'application/pdf'],
    ['JPG', 'fictional-photo.jpg', 'image/jpeg'],
    ['JPEG', 'fictional-photo.JPEG', 'image/jpeg'],
    ['PNG', 'fictional-image.png', 'image/png'],
  ])('accepts allow-listed %s metadata', (description, originalname, mimetype) => {
    const validation = validateEvidence(fileMetadata({ originalname, mimetype }));

    expect(validation).toEqual({
      isValid: true,
      value: { filename: originalname },
      errors: {},
    });
  });

  test('keeps only a sanitized base filename from otherwise valid metadata', () => {
    const metadata = fileMetadata({
      originalname: '../../private\\<unsafe>\u202e report.PDF',
      buffer: Buffer.from('file contents must not survive validation'),
      path: '/tmp/private/unsafe.pdf',
      destination: '/tmp/private',
    });

    expect(sanitizeEvidenceFilename(metadata.originalname)).toBe('_unsafe_ report.PDF');
    expect(validateEvidence(metadata)).toEqual({
      isValid: true,
      value: { filename: '_unsafe_ report.PDF' },
      errors: {},
    });
  });

  test.each([
    ['an unknown extension and MIME type', 'fictional-evidence.txt', 'text/plain'],
    ['a mismatched extension and MIME type', 'fictional-evidence.pdf', 'image/png'],
    ['a filename without an extension', 'fictional-evidence', 'application/pdf'],
  ])('rejects %s', (description, originalname, mimetype) => {
    expect(validateEvidence(fileMetadata({ originalname, mimetype }))).toEqual({
      isValid: false,
      value: { filename: null },
      errors: {
        evidence: {
          text: 'The selected file must be a PDF, JPG or PNG',
          href: '#evidence',
        },
      },
    });
  });

  test.each([
    [evidenceUploadLimits.maxFileSizeBytes, true],
    [evidenceUploadLimits.maxFileSizeBytes + 1, false],
  ])('validates the %i-byte size boundary', (size, isValid) => {
    const validation = validateEvidence(fileMetadata({ size }));

    expect(validation.isValid).toBe(isValid);
    expect(validation.errors.evidence?.text).toBe(
      isValid ? undefined : 'The selected file must be 2 MB or smaller',
    );
  });

  test.each([
    ['missing filename', { originalname: undefined }],
    ['non-numeric size', { size: '1024' }],
    ['negative size', { size: -1 }],
    [
      'overlong filename',
      { originalname: `${'a'.repeat(evidenceUploadLimits.maxFilenameLength)}.pdf` },
    ],
  ])('rejects malformed metadata with a linked error for %s', (description, overrides) => {
    const validation = validateEvidence(fileMetadata(overrides));

    expect(validation.isValid).toBe(false);
    expect(validation.errors.evidence).toEqual({
      text: 'The selected file could not be read. Choose another file',
      href: '#evidence',
    });
  });

  test('maps parser size and generic failures to linked evidence errors', () => {
    expect(evidenceParserErrors({ code: 'LIMIT_FILE_SIZE' })).toEqual({
      evidence: {
        text: 'The selected file must be 2 MB or smaller',
        href: '#evidence',
      },
    });
    expect(evidenceParserErrors(new Error('Malformed multipart body'))).toEqual({
      evidence: {
        text: 'The selected file could not be uploaded. Try again',
        href: '#evidence',
      },
    });
  });
});
