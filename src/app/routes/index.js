const express = require('express');
const businessDetailsController = require('../controllers/business-details-controller');
const businessTypeController = require('../controllers/business-type-controller');
const checkAnswersController = require('../controllers/check-answers-controller');
const personalDetailsController = require('../controllers/personal-details-controller');
const startController = require('../controllers/start-controller');
const updatesController = require('../controllers/updates-controller');

const router = express.Router();

router.get('/', startController.redirectToStart);
router.get('/start', startController.showStart);
router.get('/business-type', businessTypeController.showBusinessType);
router.post('/business-type', businessTypeController.submitBusinessType);
router.get('/business-details', businessDetailsController.showBusinessDetails);
router.post('/business-details', businessDetailsController.submitBusinessDetails);
router.get('/full-name', personalDetailsController.showPersonalDetails);
router.post('/full-name', personalDetailsController.submitPersonalDetails);
router.get('/updates', updatesController.showUpdates);
router.post('/updates', updatesController.submitUpdates);
router.get('/check-answers', checkAnswersController.showCheckAnswers);
router.post('/check-answers', checkAnswersController.submitCheckAnswers);
router.get('/confirmation', checkAnswersController.showConfirmation);

module.exports = router;
