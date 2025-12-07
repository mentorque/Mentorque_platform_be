const express = require('express');
const router = express.Router();
const { authenticateFirebaseToken } = require('../../middleware/apiKeyAuth');
const apiKeysController = require('../controllers/apiKeys');

// All routes require Firebase authentication
router.get('/', authenticateFirebaseToken, apiKeysController.getUserAPIKeys);
router.post('/', authenticateFirebaseToken, apiKeysController.createAPIKey);
router.delete('/:keyId', authenticateFirebaseToken, apiKeysController.deleteAPIKey);

module.exports = router;

