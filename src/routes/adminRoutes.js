const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const userStatusController = require('../controllers/userStatus');
const { authenticateAdminToken } = require('../middleware/adminAuth');
const { upload } = require('../utils/cloudinary');

// Public routes
router.post('/signup', adminController.signup);
router.post('/login', adminController.login);
router.post('/logout', adminController.logout);

// Protected routes
router.get('/me', authenticateAdminToken, adminController.getMe);
router.get('/stats', authenticateAdminToken, adminController.getAdminStats);
router.get('/mentor/users', authenticateAdminToken, adminController.getMentorUsers);
router.get('/all-users', authenticateAdminToken, adminController.getAllUsers);
// DELETE route must come before GET route with same pattern to avoid conflicts
router.delete('/mentors/:mentorId', authenticateAdminToken, adminController.deleteMentor);
router.get('/mentors/:mentorId/stats', authenticateAdminToken, adminController.getMentorStats);
router.get('/mentors', authenticateAdminToken, adminController.getAllMentors);
router.get('/users/:userId', authenticateAdminToken, adminController.getUserDetails);
router.get('/users/:userId/jobs', authenticateAdminToken, adminController.getUserAppliedJobs);
router.get('/users/:userId/jobs/stats', authenticateAdminToken, adminController.getUserAppliedJobsStats);
router.get('/users/:userId/status', authenticateAdminToken, userStatusController.getUserStatus);
router.get('/users/:userId/eligible-calls', authenticateAdminToken, adminController.getEligibleCalls);
router.patch('/users/:userId/status', authenticateAdminToken, userStatusController.updateUserStatus);
router.patch('/users/:userId/mentor', authenticateAdminToken, adminController.assignMentor);
router.patch('/users/:userId/toggle-verification', authenticateAdminToken, adminController.toggleUserVerification);
router.delete('/users/:userId', authenticateAdminToken, adminController.deleteUser);
router.patch('/profile', authenticateAdminToken, upload.single('picture'), adminController.updateProfile);

// Approval management routes (admin only)
router.get('/approvals', authenticateAdminToken, adminController.getPendingApprovals);
router.patch('/approvals/users/:userId', authenticateAdminToken, adminController.verifyUser);
router.patch('/approvals/mentors/:mentorId', authenticateAdminToken, adminController.verifyMentor);
router.delete('/approvals/users/:userId', authenticateAdminToken, adminController.declineUser);
router.delete('/approvals/mentors/:mentorId', authenticateAdminToken, adminController.declineMentor);

// Mentoring sessions routes
router.get('/users/:userId/scheduled-calls', authenticateAdminToken, adminController.getUserScheduledCalls);
router.post('/users/:userId/schedule-call', authenticateAdminToken, adminController.scheduleMentorCall);
router.patch('/users/:userId/update-call', authenticateAdminToken, adminController.updateScheduledCall);
router.delete('/mentoring-sessions/:userId/:callNumber', authenticateAdminToken, adminController.deleteMentorCall);
router.patch('/users/:userId/calls/:callNumber/complete', authenticateAdminToken, adminController.completeMentorCall);
router.get('/mentoring-sessions', authenticateAdminToken, adminController.getMentoringSessions);

module.exports = router;

