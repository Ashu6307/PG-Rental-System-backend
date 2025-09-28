
import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import ctrl from '../controllers/userLoyaltyController.js';
const router = express.Router();

router.get('/', authenticateJWT, ctrl.getLoyalty);
router.post('/add', authenticateJWT, ctrl.addPoints);
router.post('/redeem', authenticateJWT, ctrl.redeemReward);

export default router;
