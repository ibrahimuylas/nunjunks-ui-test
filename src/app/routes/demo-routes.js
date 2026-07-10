const express = require('express');
const cookieController = require('../controllers/demo/cookie-controller');
const homeController = require('../controllers/demo/home-controller');
const supportStartController = require('../controllers/demo/support/start-controller');

const router = express.Router();

router.use(cookieController.addCookieBanner);
router.get('/', homeController.showHome);
router.post('/cookies', cookieController.updateCookiePreference);
router.get('/support/start', supportStartController.showStart);
router.post('/support/reset', homeController.resetSupport);
router.post('/casework/reset', homeController.resetCasework);

module.exports = router;
