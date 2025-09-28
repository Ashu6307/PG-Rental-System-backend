import express from 'express';
import { getOwnerAnalytics, getOwnerAnalyticsByPeriod } from '../controllers/ownerAnalyticsController.js';
import { authenticateJWT, ownerAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateJWT, ownerAuth, getOwnerAnalytics);
router.get('/period/:period/:year/:month', authenticateJWT, ownerAuth, getOwnerAnalyticsByPeriod);

export default router;
