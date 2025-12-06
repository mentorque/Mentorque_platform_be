const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progress');
const { authenticateFirebaseToken } = require('../../middleware/apiKeyAuth');

// All progress routes require Firebase authentication
router.get('/', authenticateFirebaseToken, progressController.getProgress);
router.put('/week/:index/done', authenticateFirebaseToken, progressController.updateWeekDone);
router.put('/week/:index/notes', authenticateFirebaseToken, progressController.updateWeekNotes);

module.exports = router;

