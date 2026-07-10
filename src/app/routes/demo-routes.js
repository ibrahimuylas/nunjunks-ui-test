const express = require('express');
const homeController = require('../controllers/demo/home-controller');

const router = express.Router();

router.get('/', homeController.showHome);

module.exports = router;
