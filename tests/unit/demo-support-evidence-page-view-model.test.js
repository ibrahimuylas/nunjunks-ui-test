const { Buffer } = require('node:buffer');
const {
  supportEvidencePageViewModel,
} = require('../../src/app/view-models/demo/support/evidence-page-view-model');

describe('demo support evidence page view model', () => {
  test('prepares the optional enhanced file upload with matching type and size guidance', () => {
    const model = supportEvidencePageViewModel();

    expect(model.pageTitle).toBe('Evidence');
    expect(model.heading).toBe('Evidence');
    expect(model.backLink).toEqual({
      text: 'Back',
      href: '/demo/support/support-needs',
    });
    expect(model.formAction).toBe('/demo/support/evidence');
    expect(model.selectedFilename).toBeNull();
    expect(model.evidenceFileUpload).toMatchObject({
      id: 'evidence',
      name: 'evidence',
      javascript: true,
      label: { text: 'Upload a fictional supporting document (optional)' },
      hint: {
        text: 'PDF, JPG or PNG. Maximum file size: 2 MB. File contents are discarded and are not stored.',
      },
    });
    expect(model.evidenceFileUpload.attributes.accept.split(',')).toEqual(
      expect.arrayContaining([
        '.pdf',
        '.jpg',
        '.jpeg',
        '.png',
        'application/pdf',
        'image/jpeg',
        'image/png',
      ]),
    );
    expect(model.serviceNavigation.navigation).toContainEqual(
      expect.objectContaining({ text: 'Public journey', active: true }),
    );
  });

  test('shows the safe saved filename and maps linked errors to GOV.UK options', () => {
    const errors = {
      evidence: {
        text: 'The selected file must be a PDF, JPG or PNG',
        href: '#evidence',
      },
    };
    const model = supportEvidencePageViewModel({
      values: { filename: 'fictional-evidence.pdf' },
      errors,
    });

    expect(model.pageTitle).toBe('Error: Evidence');
    expect(model.selectedFilename).toBe('fictional-evidence.pdf');
    expect(model.errorSummary).toEqual({
      titleText: 'There is a problem',
      errorList: Object.values(errors),
    });
    expect(model.evidenceFileUpload.errorMessage).toEqual({ text: errors.evidence.text });
  });

  test('does not expose a non-string stored filename', () => {
    expect(supportEvidencePageViewModel({ values: { filename: Buffer.from('unsafe') } })).toEqual(
      expect.objectContaining({ selectedFilename: null }),
    );
  });
});
