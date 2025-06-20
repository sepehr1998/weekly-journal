const express = require('express');
const router = express.Router();
const summaryController = require('../controllers/summaryController');

router.get('/', summaryController.getSummaries);
router.post('/', summaryController.saveSummary);
router.post('/generate-summary', summaryController.generateAISummary);

module.exports = router;
