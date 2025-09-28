// Import necessary modules and middleware
import express from 'express';
const router = express.Router();
import User from '../models/User.js';
import { authenticateJWT } from '../middleware/auth.js';

// Get current user profile (for /api/users/me)
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Advanced user search/filter endpoint
router.post('/search', async (req, res) => {
  const { filters, sort, page, limit } = req.body;
  try {
    // TODO: Implement advanced search/filter logic
    // Example: Use MongoDB aggregation for flexible search
    const users = await User.aggregate([
      { $match: filters || {} },
      { $sort: sort || { createdAt: -1 } },
      { $skip: ((page || 1) - 1) * (limit || 20) },
      { $limit: limit || 20 },
    ]);
    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Get all users with account creation and last login info
router.get('/admin/list', async (req, res) => {
  try {
    const users = await User.find({}, 'name email createdAt lastLogin');
    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user document verification status
router.get('/admin/doc-status/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('documents');
    res.status(200).json({ success: true, documents: user.documents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user KYC status
router.get('/admin/kyc-status/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    res.status(200).json({ success: true, kycStatus: user.kycStatus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export the router
export default router;