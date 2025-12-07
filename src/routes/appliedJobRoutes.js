const express = require('express');
const router = express.Router();
const { authenticateFirebaseToken } = require('../../middleware/apiKeyAuth');
const appliedJobsController = require('../controllers/appliedJobs');

// All routes require Firebase authentication
router.get('/', authenticateFirebaseToken, appliedJobsController.getAppliedJobs);
router.post('/', authenticateFirebaseToken, appliedJobsController.createAppliedJob);
router.get('/goal', authenticateFirebaseToken, appliedJobsController.getDailyGoal);
router.patch('/goal', authenticateFirebaseToken, appliedJobsController.updateDailyGoal);
router.patch('/:jobId/status', authenticateFirebaseToken, appliedJobsController.updateJobStatus);
router.delete('/:jobId', authenticateFirebaseToken, appliedJobsController.deleteAppliedJob);

module.exports = router;

