// adminReviews.js
const express = require('express');
const router = express.Router();
const adminReviewController = require('../controllers/adminReviewController');

// List reviews/feedback
router.get('/', adminReviewController.listReviews);
// Approve/reject review
router.patch('/:id/status', adminReviewController.updateReviewStatus);
// Delete review
router.delete('/:id', adminReviewController.deleteReview);

module.exports = router;
