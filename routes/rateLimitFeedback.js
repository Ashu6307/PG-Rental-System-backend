const express = require('express');
const router = express.Router();
const rateLimitFeedbackController = require('../controllers/rateLimitFeedbackController');
const auth = require('../middleware/auth');

// Get user rate limit feedback
router.get('/my', auth, rateLimitFeedbackController.getUserRateLimitFeedback);
// Add rate limit feedback
router.post('/add', auth, rateLimitFeedbackController.addRateLimitFeedback);
// Soft delete feedback
router.delete('/:id', auth, rateLimitFeedbackController.deleteRateLimitFeedback);

module.exports = router;