const {
  demoCaseworkCaseNoteCharacterLimit,
  demoCaseworkDecisions,
  getDecisionStatus,
  normalizeCaseNote,
  validateDecision,
} = require('../../src/app/validators/demo/casework/decision-validator');

describe('demo casework decision validator', () => {
  test('defines exactly the three demonstration decisions and their statuses', () => {
    expect(demoCaseworkDecisions).toEqual([
      { value: 'priority', text: 'Priority', status: 'priority' },
      { value: 'standard', text: 'Standard', status: 'standard' },
      {
        value: 'more-information-needed',
        text: 'More information needed',
        status: 'more-information-needed',
      },
    ]);
    expect(Object.isFrozen(demoCaseworkDecisions)).toBe(true);
    expect(demoCaseworkDecisions.every(Object.isFrozen)).toBe(true);
  });

  test.each(demoCaseworkDecisions)(
    'accepts and maps the $text decision',
    ({ value, status }) => {
      expect(getDecisionStatus(value)).toBe(status);
      expect(validateDecision({ decision: `  ${value}  `, caseNote: undefined })).toEqual({
        isValid: true,
        value: { decision: value, caseNote: '' },
        errors: {},
      });
    },
  );

  test.each([undefined, null, {}, [], { decision: '' }, { decision: '   ' }])(
    'rejects missing decision input %p with a linked error',
    (body) => {
      expect(validateDecision(body)).toEqual({
        isValid: false,
        value: { decision: '', caseNote: '' },
        errors: {
          decision: {
            text: 'Select a demonstration decision',
            href: '#decision',
          },
        },
      });
    },
  );

  test.each(['urgent', 'Priority', ['priority'], { value: 'priority' }])(
    'rejects unknown decision value %p',
    (decision) => {
      const validation = validateDecision({ decision });

      expect(validation.isValid).toBe(false);
      expect(validation.errors.decision).toEqual({
        text:
          typeof decision === 'string'
            ? 'Select a demonstration decision from the list'
            : 'Select a demonstration decision',
        href: '#decision',
      });
      expect(getDecisionStatus(validation.value.decision)).toBeNull();
    },
  );

  test('normalizes surrounding whitespace and textarea line endings in the optional note', () => {
    expect(normalizeCaseNote('  First line\r\nSecond line\r  ')).toBe(
      'First line\nSecond line',
    );
    expect(
      validateDecision({
        decision: 'standard',
        caseNote: '  Fictional case note.  ',
      }).value,
    ).toEqual({
      decision: 'standard',
      caseNote: 'Fictional case note.',
    });
  });

  test.each([
    [demoCaseworkCaseNoteCharacterLimit, true],
    [demoCaseworkCaseNoteCharacterLimit + 1, false],
  ])('validates the %i-character case-note boundary', (length, isValid) => {
    const validation = validateDecision({
      decision: 'priority',
      caseNote: 'x'.repeat(length),
    });

    expect(validation.isValid).toBe(isValid);
    expect(validation.value.caseNote).toHaveLength(length);
    expect(validation.errors.caseNote).toEqual(
      isValid
        ? undefined
        : {
            text: `Case note must be ${demoCaseworkCaseNoteCharacterLimit} characters or fewer`,
            href: '#caseNote',
          },
    );
  });
});
