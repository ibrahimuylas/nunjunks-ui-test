const { Buffer } = require('node:buffer');
const { expect, test } = require('./fixtures');
const {
  caseworkPaths,
  decisionPath,
  journeyRecord,
  queueFilterPath,
  requestPath,
  signInCaseworker,
} = require('./helpers/demo-casework');
const { expectReviewedDemoPage } = require('./helpers/demo-content');
const {
  chooseEligibility,
  fillAboutYou,
  fillSupportNeeds,
  supportPaths,
} = require('./helpers/demo-support');

const eligibleLabel = 'Yes, continue to the fictional application tasks';
const ineligibleLabel = 'No, show the fictional ineligible outcome';
const selectedTab = 'my-requests';
const selectedPage = 1;
const supportChangePaths = Object.freeze({
  eligibility: '/demo/support/eligibility/change',
  aboutYou: '/demo/support/about-you/change',
  supportNeeds: '/demo/support/support-needs/change',
  evidence: '/demo/support/evidence/change',
});

function validationConsoleMessage(path) {
  return `console.error: Failed to load resource: the server responded with a status of 400 (Bad Request) (http://[::1]:3000${path}:1:1)`;
}

test.describe('demo public content and page semantics', () => {
  test.use({
    allowedConsoleMessages: [
      supportPaths.eligibility,
      supportPaths.aboutYou,
      supportPaths.supportNeeds,
      supportPaths.evidence,
    ].map(validationConsoleMessage),
  });

  test('reviews every public template, validation state and change state', async ({ page }) => {
    test.setTimeout(90_000);

    await test.step('landing page and cookie states', async () => {
      await page.goto('/demo');
      await expectReviewedDemoPage(page, {
        heading: 'Choose a fictional service journey',
        mainText: 'It does not provide emergency housing support or make casework decisions.',
      });
      await expect(
        page.getByRole('heading', { name: 'Cookies on this component demo' }),
      ).toBeVisible();
      await expect(page.locator('.govuk-cookie-banner')).toContainText(
        'no optional cookies are set',
      );

      await page.getByRole('button', { name: 'Accept optional cookies' }).click();
      await expect(page.locator('.govuk-cookie-banner')).toContainText(
        'You accepted optional cookies for this demonstration. No optional cookies were set.',
      );
      await page.getByRole('button', { name: 'Hide cookie message' }).click();
      await expect(page.locator('.govuk-cookie-banner')).toHaveCount(0);
    });

    await test.step('start, eligibility error and ineligible outcome', async () => {
      await page.goto(supportPaths.start);
      await expectReviewedDemoPage(page, {
        heading: 'Request emergency housing support',
        mainText: 'It does not provide emergency housing support or contact a real caseworker.',
      });

      await page.getByRole('button', { name: 'Start now' }).click();
      await expectReviewedDemoPage(page, {
        heading: 'Can this fictional support request continue?',
        mainText: 'It is not an eligibility decision for a real service.',
      });

      await page.getByRole('button', { name: 'Continue' }).click();
      await expect(page.locator('.govuk-error-summary')).toBeVisible();
      await expectReviewedDemoPage(page, {
        heading: 'Can this fictional support request continue?',
        mainText: 'Select whether the fictional request is eligible to continue',
      });

      await chooseEligibility(page, ineligibleLabel);
      await expectReviewedDemoPage(page, {
        heading: 'This fictional request cannot continue',
        mainText: 'does not affect access to real housing support',
      });

      await page.getByRole('link', { name: 'Change the fictional eligibility answer' }).click();
      await expectReviewedDemoPage(page, {
        heading: 'Can this fictional support request continue?',
        mainText: 'It is not an eligibility decision for a real service.',
      });
      await chooseEligibility(page, eligibleLabel);
    });

    await test.step('task list and about-you states', async () => {
      await page.goto(supportPaths.tasks);
      await expectReviewedDemoPage(page, {
        heading: 'Application tasks',
        mainText: 'Complete the fictional support request sections.',
      });
      await page.getByRole('link', { name: 'About you' }).click();
      await expectReviewedDemoPage(page, {
        heading: 'About you',
        mainText: 'Do not enter information about a real person.',
      });

      await page.getByRole('button', { name: 'Save and continue' }).click();
      await expect(page.locator('.govuk-error-summary')).toBeVisible();
      await expectReviewedDemoPage(page, {
        heading: 'About you',
        mainText: 'Enter a fictional full name',
      });
      await fillAboutYou(page);
      await page.getByRole('button', { name: 'Save and continue' }).click();
    });

    await test.step('support-needs states', async () => {
      await page.getByRole('link', { name: 'Support needs' }).click();
      await expectReviewedDemoPage(page, {
        heading: 'Support needs',
        mainText: 'Do not enter details about a real person or situation.',
      });

      await page.getByRole('button', { name: 'Save and continue' }).click();
      await expect(page.locator('.govuk-error-summary')).toBeVisible();
      await expectReviewedDemoPage(page, {
        heading: 'Support needs',
        mainText: 'Select at least one type of fictional support',
      });
      await fillSupportNeeds(page);
      await page.getByRole('button', { name: 'Save and continue' }).click();
    });

    await test.step('evidence states and completed task list', async () => {
      await page.getByRole('link', { name: 'Evidence' }).click();
      await expectReviewedDemoPage(page, {
        heading: 'Evidence',
        mainText: 'Use a fictional document only.',
      });

      await page.locator('#evidence-input').setInputFiles({
        name: 'not-allowed.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('fictional rejected evidence'),
      });
      await page.getByRole('button', { name: 'Save and continue' }).click();
      await expect(page.locator('.govuk-error-summary')).toBeVisible();
      await expectReviewedDemoPage(page, {
        heading: 'Evidence',
        mainText: 'The selected file must be a PDF, JPG or PNG',
      });

      await page.locator('#evidence-input').setInputFiles({
        name: 'fictional-content-review.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('fictional accepted evidence'),
      });
      await page.getByRole('button', { name: 'Save and continue' }).click();
      await expectReviewedDemoPage(page, {
        heading: 'Application tasks',
        mainText: 'Complete the fictional support request sections.',
      });
    });

    await test.step('every change state and check answers', async () => {
      const changeStates = [
        {
          path: supportChangePaths.eligibility,
          heading: 'Can this fictional support request continue?',
          mainText: 'It is not an eligibility decision for a real service.',
        },
        {
          path: supportChangePaths.aboutYou,
          heading: 'About you',
          mainText: 'Do not enter information about a real person.',
        },
        {
          path: supportChangePaths.supportNeeds,
          heading: 'Support needs',
          mainText: 'Do not enter details about a real person or situation.',
        },
        {
          path: supportChangePaths.evidence,
          heading: 'Evidence',
          mainText: 'Selected demonstration file: fictional-content-review.pdf',
        },
      ];

      for (const state of changeStates) {
        await page.goto(state.path);
        await expectReviewedDemoPage(page, state);
      }

      await page.goto(supportPaths.checkAnswers);
      await expectReviewedDemoPage(page, {
        heading: 'Check your answers',
        mainText: 'Check the fictional information before submitting the demonstration request.',
      });
    });

    await test.step('confirmation state', async () => {
      await page.getByRole('button', { name: 'Submit fictional request' }).click();
      await expectReviewedDemoPage(page, {
        heading: 'Fictional request submitted',
        mainText: 'This demonstration has not sent the request to a housing service',
      });
    });
  });
});

test.describe('demo caseworker content and page semantics', () => {
  const decisionFormPath = decisionPath(journeyRecord.reference, selectedTab, selectedPage);

  test.use({
    allowedConsoleMessages: [caseworkPaths.signIn, decisionFormPath].map(validationConsoleMessage),
  });

  test('reviews every caseworker template, validation state and queue state', async ({ page }) => {
    test.setTimeout(90_000);

    await test.step('sign-in states use plain fictional guidance', async () => {
      await page.goto(caseworkPaths.signIn);
      await expectReviewedDemoPage(page, {
        heading: 'Sign in to the fictional casework queue',
        mainText: 'The made-up value is discarded immediately and is not stored.',
      });
      await expect(page.locator('#main-content')).not.toContainText('session access flag');

      await page.getByRole('button', { name: 'Continue' }).click();
      await expect(page.locator('.govuk-error-summary')).toBeVisible();
      await expectReviewedDemoPage(page, {
        heading: 'Sign in to the fictional casework queue',
        mainText: 'Enter a demonstration password',
      });
      await signInCaseworker(page);
    });

    await test.step('all queue states', async () => {
      for (const tab of ['unassigned', 'my-requests', 'completed']) {
        await page.goto(queueFilterPath(tab));
        await expectReviewedDemoPage(page, {
          heading: 'Fictional support request queue',
          mainText: 'Review fictional emergency housing support requests.',
        });
      }
    });

    await test.step('request and decision states', async () => {
      await page.goto(requestPath(journeyRecord.reference, selectedTab, selectedPage));
      await expectReviewedDemoPage(page, {
        heading: `Request ${journeyRecord.reference}`,
        mainText: 'Review the fictional information before recording a demonstration decision.',
      });

      await page.getByRole('button', { name: 'Record a decision' }).click();
      await expectReviewedDemoPage(page, {
        heading: `Record a decision for ${journeyRecord.reference}`,
        mainText: 'This does not make a decision about a real support request.',
      });

      await page.getByRole('button', { name: 'Save demonstration decision' }).click();
      await expect(page.locator('.govuk-error-summary')).toBeVisible();
      await expectReviewedDemoPage(page, {
        heading: `Record a decision for ${journeyRecord.reference}`,
        mainText: 'Select a demonstration decision',
      });
    });

    await test.step('saved outcome remains explicitly fictional', async () => {
      await page.getByLabel('Priority', { exact: true }).check();
      await page.getByRole('button', { name: 'Save demonstration decision' }).click();
      await expectReviewedDemoPage(page, {
        heading: `Fictional decision saved for ${journeyRecord.reference}`,
        mainText: `Fictional request ${journeyRecord.reference} was recorded as Priority for this demonstration.`,
      });
    });
  });
});
