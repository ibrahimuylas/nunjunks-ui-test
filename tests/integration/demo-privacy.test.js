const { Buffer } = require('node:buffer');
const { inspect } = require('node:util');
const request = require('supertest');
const { createApp } = require('../../src/app/app');
const journeyService = require('../../src/app/services/journey-service');

const applicationLogMethods = ['debug', 'error', 'info', 'log', 'warn'];

function spyOnApplicationLogs() {
  return applicationLogMethods.map((method) =>
    jest.spyOn(console, method).mockImplementation(() => {}),
  );
}

function expectLogsToExclude(spies, sensitiveValues) {
  const logOutput = inspect(
    spies.flatMap((spy) => spy.mock.calls),
    { depth: null },
  );

  sensitiveValues.forEach((value) => expect(logOutput).not.toContain(value));
}

describe('demo privacy boundaries', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('discards uploaded bytes and stores only a sanitized filename without logging either', async () => {
    const agent = request.agent(createApp());
    const uploadedBytes = 'PRIVATE-UPLOAD-BYTES-25B-MUST-NOT-SURVIVE';
    const submittedFilename = 'private<script>-25B.pdf';
    const safeFilename = 'private_script_-25B.pdf';
    const completeEvidenceSpy = jest.spyOn(journeyService, 'completeDemoSupportEvidence');
    const logSpies = spyOnApplicationLogs();

    await agent
      .post('/demo/support/eligibility')
      .type('form')
      .send({ eligibility: 'eligible' })
      .expect(302)
      .expect('Location', '/demo/support/tasks');
    await agent
      .post('/demo/support/evidence')
      .attach('evidence', Buffer.from(uploadedBytes), {
        filename: submittedFilename,
        contentType: 'application/pdf',
      })
      .expect(302)
      .expect('Location', '/demo/support/tasks');

    expect(completeEvidenceSpy).toHaveBeenCalledTimes(1);
    const [session, savedEvidence] = completeEvidenceSpy.mock.calls[0];
    const supportState = journeyService.getDemoSupportState(session);

    expect(savedEvidence).toEqual({ filename: safeFilename });
    expect(supportState).toEqual({
      values: {
        eligibility: 'eligible',
        evidence: { filename: safeFilename },
      },
      completion: { evidence: true },
    });
    expect(Object.keys(supportState.values.evidence)).toEqual(['filename']);
    expect(JSON.stringify(session)).not.toContain(uploadedBytes);
    expect(JSON.stringify(session)).not.toContain(submittedFilename);
    expectLogsToExclude(logSpies, [uploadedBytes, submittedFilename]);
  });

  test('discards the demonstration password and stores only the access flag without logging it', async () => {
    const demonstrationPassword = 'REAL-LOOKING-PASSWORD-25B-MUST-NOT-SURVIVE';
    const grantAccessSpy = jest.spyOn(journeyService, 'grantDemoCaseworkAccess');
    const logSpies = spyOnApplicationLogs();

    await request(createApp())
      .post('/demo/casework/sign-in')
      .type('form')
      .send({ password: `  ${demonstrationPassword}  ` })
      .expect(302)
      .expect('Location', '/demo/casework/queue');

    expect(grantAccessSpy).toHaveBeenCalledTimes(1);
    const [session] = grantAccessSpy.mock.calls[0];

    expect(journeyService.getDemoCaseworkState(session)).toEqual({
      values: {},
      completion: { signedIn: true },
    });
    expect(JSON.stringify(session)).not.toContain(demonstrationPassword);
    expectLogsToExclude(logSpies, [demonstrationPassword]);
  });
});
