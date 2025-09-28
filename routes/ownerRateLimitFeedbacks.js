
import express from 'express';
import { ownerAuth } from '../middleware/auth.js';
import ctrl from '../controllers/ownerRateLimitFeedbackController.js';
const router = express.Router();

router.get('/', ownerAuth, ctrl.getFeedbacks);
router.post('/', ownerAuth, ctrl.createFeedback);
router.put('/:id', ownerAuth, ctrl.updateFeedback);

export default router;
