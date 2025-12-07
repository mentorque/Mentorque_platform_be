const express = require('express');
const router = express.Router();
const { authenticateFirebaseToken } = require('../../middleware/apiKeyAuth');
const userController = require('../controllers/users');
const userStatusController = require('../controllers/userStatus');

// Protected routes (require Firebase auth)
router.get('/me/mentor', authenticateFirebaseToken, userController.getMyMentor);
router.get('/mentors', authenticateFirebaseToken, userController.getAllMentors);
router.get('/me/status', authenticateFirebaseToken, userStatusController.getMyStatus);
router.post('/me/book-call', authenticateFirebaseToken, userStatusController.bookCall);
router.get('/me/verification', authenticateFirebaseToken, userController.getMyVerification);
router.get('/me/mentor-session-notes', authenticateFirebaseToken, userController.getMySessionNotes);

module.exports = router;

