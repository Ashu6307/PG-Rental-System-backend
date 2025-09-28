import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import {
  broadcastBookingUpdate,
  sendNotification,
  broadcastAnalyticsUpdate,
  getSystemStatus,
  testWebSocket,
  triggerSampleUpdates
} from '../controllers/websocketController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateJWT);

// Real-time update routes
router.post('/booking-update', broadcastBookingUpdate);
router.post('/notification', sendNotification);
router.post('/analytics-update', broadcastAnalyticsUpdate);

// System status and testing
router.get('/status', getSystemStatus);
router.get('/test/:userId', testWebSocket);
router.post('/trigger-samples/:userId', triggerSampleUpdates);

export default router;