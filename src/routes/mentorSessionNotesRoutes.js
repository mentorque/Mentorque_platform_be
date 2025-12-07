const express = require('express');
const router = express.Router();
const mentorSessionNotesController = require('../controllers/mentorSessionNotes');
const { authenticateAdminToken } = require('../middleware/adminAuth');

// All routes require admin/mentor authentication
router.get('/:userId', authenticateAdminToken, mentorSessionNotesController.getSessionNotes);
router.put('/:userId/:callNumber', authenticateAdminToken, mentorSessionNotesController.updateSessionNotes);
router.delete('/:userId/:callNumber', authenticateAdminToken, mentorSessionNotesController.deleteSessionNotes);

module.exports = router;

