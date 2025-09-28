import express from 'express';
import { 
  sendNewsletter,
  sendPromotionalOffer,
  sendSeasonalCampaign,
  sendRetentionEmail,
  getEmailStats
} from '../controllers/marketingController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// Admin only middleware (you might have this already)
const adminAuth = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Get email campaign statistics
router.get('/stats', authenticateJWT, adminAuth, getEmailStats);

// Send newsletter to all subscribed users
router.post('/newsletter', authenticateJWT, adminAuth, sendNewsletter);

// Send promotional offer
router.post('/promotional-offer', authenticateJWT, adminAuth, sendPromotionalOffer);

// Send seasonal campaign
router.post('/seasonal-campaign', authenticateJWT, adminAuth, sendSeasonalCampaign);

// Send retention emails to inactive users
router.post('/retention-email', authenticateJWT, adminAuth, sendRetentionEmail);

export default router;
