import express from 'express';
import { getOwnerReviews, respondToReview } from '../controllers/ownerReviewController.js';
import { ownerAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', ownerAuth, getOwnerReviews);
router.put('/:id/respond', ownerAuth, respondToReview);

export default router;
