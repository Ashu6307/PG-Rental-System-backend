import express from 'express';
import { getOwnerNotifications, markNotificationRead, deleteNotification } from '../controllers/ownerNotificationController.js';
import { authenticateJWT, ownerAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateJWT, ownerAuth, getOwnerNotifications);
router.put('/:id/read', authenticateJWT, ownerAuth, markNotificationRead);
router.delete('/:id', authenticateJWT, ownerAuth, deleteNotification);

export default router;
