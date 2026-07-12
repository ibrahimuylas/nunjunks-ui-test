const { Buffer } = require('node:buffer');
const request = require('supertest');
const { createApp } = require('../../src/app/app');

async function chooseEligible(agent) {
  await agent
    .post('/demo/support/eligibility')
    .type('form')
    .send({ eligibility: 'eligible' })
    .expect(302);
}

async function completeAboutYou(agent, fullName = 'Alex Example') {
  await agent
    .post('/demo/support/about-you')
    .type('form')
    .send({
      fullName,
      'dateOfBirth-day': '7',
      'dateOfBirth-month': '9',
      'dateOfBirth-year': '1990',
      country: 'scotland',
    })
    .expect(302);
}

async function completeSupportNeeds(agent, description = 'A fictional support description') {
  await agent
    .post('/demo/support/support-needs')
    .type('form')
    .send({
      supportTypes: ['safe-accommodation', 'wellbeing'],
      description,
      additionalInformation: '',
    })
    .expect(302);
}

async function completeEvidenceWithoutFile(agent) {
  await agent
    .post('/demo/support/evidence')
    .set('Content-Type', 'multipart/form-data; boundary=empty-evidence')
    .send('--empty-evidence--\r\n')
    .expect(302);
}

async function completeRequiredSections(agent) {
  await chooseEligible(agent);
  await completeAboutYou(agent);
  await completeSupportNeeds(agent);
  await completeEvidenceWithoutFile(agent);
}

describe('demo support check answers', () => {
  test('redirects to each first incomplete required answer in configured order', async () => {
    const agent = request.agent(createApp());
    await chooseEligible(agent);

    await agent
      .get('/demo/support/check-answers')
      .expect(302)
      .expect('Location', '/demo/support/about-you');

    await completeAboutYou(agent);
    await agent
      .get('/demo/support/check-answers')
      .expect(302)
      .expect('Location', '/demo/support/support-needs');

    await completeSupportNeeds(agent);
    await agent
      .get('/demo/support/check-answers')
      .expect(302)
      .expect('Location', '/demo/support/evidence');
  });

  test('renders grouped cards, formatted values, specific change links and a submit action', async () => {
    const agent = request.agent(createApp());
    await completeRequiredSections(agent);

    const response = await agent.get('/demo/support/check-answers').expect(200);

    expect(response.text.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(response.text).toContain('Check your answers');
    expect(response.text.match(/class="govuk-summary-card(?: |")/g)).toHaveLength(4);
    expect(response.text.match(/class="govuk-summary-list(?: |")/g)).toHaveLength(4);
    expect(response.text).toContain('Eligibility');
    expect(response.text).toContain('7 September 1990');
    expect(response.text).toContain('Scotland');
    expect(response.text).toContain('Somewhere safe to stay, Health and wellbeing support');
    expect(response.text).toContain('Not provided');
    expect(response.text).toContain('No file selected');
    expect(response.text).toMatch(
      /href="\/demo\/support\/about-you\/change">Change<span class="govuk-visually-hidden"> fictional full name \(About you\)<\/span>/,
    );
    expect(response.text).toMatch(
      /href="\/demo\/support\/support-needs\/change">Change<span class="govuk-visually-hidden"> types of support \(Support needs\)<\/span>/,
    );
    expect(response.text).toMatch(
      /href="\/demo\/support\/evidence\/change">Change<span class="govuk-visually-hidden"> supporting document \(Evidence\)<\/span>/,
    );
    expect(response.text).toMatch(
      /<a\b(?=[^>]*href="\/demo\/support\/tasks")(?=[^>]*class="[^"]*\bgovuk-back-link\b[^"]*")[^>]*>/,
    );
    expect(response.text).toMatch(
      /<form\b(?=[^>]*method="post")(?=[^>]*action="\/demo\/support\/check-answers")(?=[^>]*novalidate)[^>]*>/,
    );
    expect(response.text).toMatch(
      /<button\b(?=[^>]*class="[^"]*\bgovuk-button\b[^"]*")(?=[^>]*type="submit")[^>]*>\s*Submit fictional request\s*<\/button>/,
    );
    expect(response.text).not.toMatch(/<button\b[^>]*disabled/);

    const tasks = await agent.get('/demo/support/tasks').expect(200);
    expect(tasks.text).toMatch(/Check your answers[\s\S]*?In progress/);
  });

  test('escapes user-entered display values and shows only the sanitized evidence filename', async () => {
    const agent = request.agent(createApp());
    const fullName = 'Alex <script>alert("name")</script>';
    const description = 'A fictional <em>support need</em>';
    await chooseEligible(agent);
    await completeAboutYou(agent, fullName);
    await completeSupportNeeds(agent, description);
    await agent
      .post('/demo/support/evidence')
      .attach('evidence', Buffer.from('discarded contents'), {
        filename: 'unsafe<script>.pdf',
        contentType: 'application/pdf',
      })
      .expect(302);

    const response = await agent.get('/demo/support/check-answers').expect(200);

    expect(response.text).toContain('Alex &lt;script&gt;alert(&quot;name&quot;)&lt;/script&gt;');
    expect(response.text).toContain('A fictional &lt;em&gt;support need&lt;/em&gt;');
    expect(response.text).toContain('unsafe_script_.pdf');
    expect(response.text).not.toContain(fullName);
    expect(response.text).not.toContain(description);
    expect(response.text).not.toContain('discarded contents');
  });

  test('guards POST submission when a required answer is missing', async () => {
    const agent = request.agent(createApp());
    await chooseEligible(agent);
    await completeAboutYou(agent);

    await agent
      .post('/demo/support/check-answers')
      .expect(302)
      .expect('Location', '/demo/support/support-needs');
  });
});
