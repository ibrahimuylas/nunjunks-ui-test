const express = require('express');
const homeController = require('../controllers/demo/home-controller');

const router = express.Router();

router.get('/', homeController.showHome);
router.post('/support/reset', homeController.resetSupport);
router.post('/casework/reset', homeController.resetCasework);

module.exports = router;
