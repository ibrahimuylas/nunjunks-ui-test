const express = require('express');
const cookieController = require('../controllers/demo/cookie-controller');
const homeController = require('../controllers/demo/home-controller');
const eligibilityController = require('../controllers/demo/support/eligibility-controller');
const supportStartController = require('../controllers/demo/support/start-controller');

const router = express.Router();

router.use(cookieController.addCookieBanner);
router.get('/', homeController.showHome);
router.post('/cookies', cookieController.updateCookiePreference);
router.get('/support/start', supportStartController.showStart);
router.get('/support/eligibility', eligibilityController.showEligibility);
router.post('/support/eligibility', eligibilityController.submitEligibility);
router.get('/support/eligibility/change', eligibilityController.showEligibilityChange);
router.post('/support/eligibility/change', eligibilityController.submitEligibilityChange);
router.get('/support/ineligible', eligibilityController.showIneligible);
router.post('/support/reset', homeController.resetSupport);
router.post('/casework/reset', homeController.resetCasework);

module.exports = router;
