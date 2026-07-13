const express = require('express');
const cookieController = require('../controllers/demo/cookie-controller');
const homeController = require('../controllers/demo/home-controller');
const caseworkQueueController = require('../controllers/demo/casework/queue-controller');
const caseworkRequestController = require('../controllers/demo/casework/request-controller');
const caseworkSignInController = require('../controllers/demo/casework/sign-in-controller');
const aboutYouController = require('../controllers/demo/support/about-you-controller');
const checkAnswersController = require('../controllers/demo/support/check-answers-controller');
const evidenceController = require('../controllers/demo/support/evidence-controller');
const eligibilityController = require('../controllers/demo/support/eligibility-controller');
const supportStartController = require('../controllers/demo/support/start-controller');
const supportNeedsController = require('../controllers/demo/support/support-needs-controller');
const taskListController = require('../controllers/demo/support/task-list-controller');

const router = express.Router();
const requireUnlockedCheckAnswers = taskListController.requireSupportStep('checkAnswers');

router.use(cookieController.addCookieBanner);
router.get('/', homeController.showHome);
router.post('/cookies', cookieController.updateCookiePreference);
router.get('/support/start', supportStartController.showStart);
router.get('/support/eligibility', eligibilityController.showEligibility);
router.post('/support/eligibility', eligibilityController.submitEligibility);
router.get('/support/eligibility/change', eligibilityController.showEligibilityChange);
router.post('/support/eligibility/change', eligibilityController.submitEligibilityChange);
router.get('/support/ineligible', eligibilityController.showIneligible);
router.use('/support/tasks', taskListController.requireSupportStep('taskList'));
router.get('/support/tasks', taskListController.showTaskList);
router.use('/support/about-you', taskListController.requireSupportStep('aboutYou'));
router.get('/support/about-you', aboutYouController.showAboutYou);
router.post('/support/about-you', aboutYouController.submitAboutYou);
router.get(
  '/support/about-you/change',
  requireUnlockedCheckAnswers,
  aboutYouController.showAboutYouChange,
);
router.post(
  '/support/about-you/change',
  requireUnlockedCheckAnswers,
  aboutYouController.submitAboutYouChange,
);
router.use('/support/support-needs', taskListController.requireSupportStep('supportNeeds'));
router.get('/support/support-needs', supportNeedsController.showSupportNeeds);
router.post('/support/support-needs', supportNeedsController.submitSupportNeeds);
router.get(
  '/support/support-needs/change',
  requireUnlockedCheckAnswers,
  supportNeedsController.showSupportNeedsChange,
);
router.post(
  '/support/support-needs/change',
  requireUnlockedCheckAnswers,
  supportNeedsController.submitSupportNeedsChange,
);
router.use('/support/evidence', taskListController.requireSupportStep('evidence'));
router.get('/support/evidence', evidenceController.showEvidence);
router.post(
  '/support/evidence',
  evidenceController.parseEvidenceUpload,
  evidenceController.submitEvidence,
);
router.get(
  '/support/evidence/change',
  requireUnlockedCheckAnswers,
  evidenceController.showEvidenceChange,
);
router.post(
  '/support/evidence/change',
  requireUnlockedCheckAnswers,
  evidenceController.parseEvidenceChangeUpload,
  evidenceController.submitEvidenceChange,
);
router.use('/support/check-answers', taskListController.requireSupportStep('checkAnswers'));
router.get('/support/check-answers', checkAnswersController.showCheckAnswers);
router.post('/support/check-answers', checkAnswersController.submitCheckAnswers);
router.get('/support/confirmation', checkAnswersController.showConfirmation);
router.post('/support/reset', homeController.resetSupport);
router.get('/casework/sign-in', caseworkSignInController.showSignIn);
router.post('/casework/sign-in', caseworkSignInController.submitSignIn);
router.post('/casework/reset', homeController.resetCasework);
router.use('/casework/queue', caseworkSignInController.requireCaseworkAccess);
router.get('/casework/queue', caseworkQueueController.showQueue);
router.use('/casework/requests', caseworkSignInController.requireCaseworkAccess);
router.get('/casework/requests/:reference', caseworkRequestController.showRequest);

module.exports = router;
