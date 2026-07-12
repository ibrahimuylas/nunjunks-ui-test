const { Buffer } = require('node:buffer');
const request = require('supertest');
const { createApp } = require('../../src/app/app');
const {
  evidenceUploadLimits,
} = require('../../src/app/validators/demo/support/evidence-validator');

async function chooseEligible(agent) {
  await agent
    .post('/demo/support/eligibility')
    .type('form')
    .send({ eligibility: 'eligible' })
    .expect(302);
}

function expectLinkedEvidenceError(response, message) {
  expect(response.text).toContain('Error: Evidence');
  expect(response.text).toMatch(/<div\b[^>]*class="[^"]*\bgovuk-error-summary\b/);
  expect(response.text).toMatch(
    new RegExp(`<a\\b[^>]*href="#evidence"[^>]*>\\s*${message}\\s*<\\/a>`),
  );
  expect(response.text).toMatch(/id="evidence-error"[^>]*class="[^"]*\bgovuk-error-message\b/);
}

describe('demo support evidence section', () => {
  test('requires an eligible support journey', async () => {
    await request(createApp())
      .get('/demo/support/evidence')
      .expect(302)
      .expect('Location', '/demo/support/eligibility');
  });

  test('renders the optional enhanced file upload, limits and linear back link', async () => {
    const agent = request.agent(createApp());
    await chooseEligible(agent);

    const response = await agent.get('/demo/support/evidence').expect(200);

    expect(response.text.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(response.text).toContain('You can complete this section without choosing a file.');
    expect(response.text).toMatch(
      /<a\b(?=[^>]*href="\/demo\/support\/support-needs")(?=[^>]*class="[^"]*\bgovuk-back-link\b[^"]*")[^>]*>/,
    );
    expect(response.text).toMatch(
      /<form\b(?=[^>]*method="post")(?=[^>]*action="\/demo\/support\/evidence")(?=[^>]*enctype="multipart\/form-data")(?=[^>]*novalidate)[^>]*>/,
    );
    expect(response.text).toMatch(
      /<div\b(?=[^>]*class="[^"]*\bgovuk-drop-zone\b)(?=[^>]*data-module="govuk-file-upload")[^>]*>/,
    );
    expect(response.text).toMatch(
      /<input\b(?=[^>]*class="[^"]*\bgovuk-file-upload\b)(?=[^>]*id="evidence")(?=[^>]*name="evidence")(?=[^>]*type="file")[^>]*>/,
    );
    expect(response.text).toContain('PDF, JPG or PNG. Maximum file size: 2 MB.');
    expect(response.text).toContain('File contents are discarded and are not stored.');

    const tasks = await agent.get('/demo/support/tasks').expect(200);
    expect(tasks.text).toMatch(/Evidence[\s\S]*?In progress/);
  });

  test('completes the section explicitly when no file is selected', async () => {
    const agent = request.agent(createApp());
    await chooseEligible(agent);

    await agent
      .post('/demo/support/evidence')
      .set('Content-Type', 'multipart/form-data; boundary=empty-evidence')
      .send('--empty-evidence--\r\n')
      .expect(302)
      .expect('Location', '/demo/support/tasks');

    const retained = await agent.get('/demo/support/evidence').expect(200);
    expect(retained.text).not.toContain('Selected demonstration file:');

    const tasks = await agent.get('/demo/support/tasks').expect(200);
    expect(tasks.text).toMatch(/Evidence[\s\S]*?Completed/);
  });

  test('keeps only a safe filename and never renders uploaded contents', async () => {
    const agent = request.agent(createApp());
    const fileContents = 'SENSITIVE-DEMO-CONTENTS-MUST-BE-DISCARDED';
    await chooseEligible(agent);

    await agent
      .post('/demo/support/evidence')
      .attach('evidence', Buffer.from(fileContents), {
        filename: 'unsafe<script>.pdf',
        contentType: 'application/pdf',
      })
      .expect(302)
      .expect('Location', '/demo/support/tasks');

    const retained = await agent.get('/demo/support/evidence').expect(200);
    expect(retained.text).toContain(
      'Selected demonstration file: <strong>unsafe_script_.pdf</strong>',
    );
    expect(retained.text).not.toContain('unsafe<script>.pdf');
    expect(retained.text).not.toContain('unsafe&lt;script&gt;.pdf');
    expect(retained.text).not.toContain(fileContents);

    const tasks = await agent.get('/demo/support/tasks').expect(200);
    expect(tasks.text).toMatch(/Evidence[\s\S]*?Completed/);
  });

  test('rejects unknown file metadata with linked summary and field errors', async () => {
    const agent = request.agent(createApp());
    await chooseEligible(agent);

    const response = await agent
      .post('/demo/support/evidence')
      .attach('evidence', Buffer.from('fictional text file'), {
        filename: 'fictional-evidence.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    expectLinkedEvidenceError(response, 'The selected file must be a PDF, JPG or PNG');
    expect(response.text).not.toContain('Selected demonstration file:');
  });

  test('maps the parser size limit to linked summary and field errors', async () => {
    const agent = request.agent(createApp());
    await chooseEligible(agent);

    const response = await agent
      .post('/demo/support/evidence')
      .attach('evidence', Buffer.alloc(evidenceUploadLimits.maxFileSizeBytes + 1), {
        filename: 'oversized-fictional-evidence.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);

    expectLinkedEvidenceError(response, 'The selected file must be 2 MB or smaller');

    const tasks = await agent.get('/demo/support/tasks').expect(200);
    expect(tasks.text).toMatch(/Evidence[\s\S]*?In progress/);
  });

  test('maps multipart parser failures without exposing implementation errors', async () => {
    const agent = request.agent(createApp());
    await chooseEligible(agent);

    const response = await agent
      .post('/demo/support/evidence')
      .attach('unexpected', Buffer.from('fictional evidence'), {
        filename: 'fictional-evidence.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);

    expectLinkedEvidenceError(
      response,
      'The selected file could not be uploaded\\. Try again',
    );
    expect(response.text).not.toContain('Unexpected field');
  });
});
