
import express from 'express';
import { 
  createPG, 
  getAllPGs, 
  getOwnerPGs, 
  getPGById, 
  getPGBySlug,
  updatePG, 
  deletePG, 
  searchPGs,
  getFeaturedPGs,
  trackInquiry 
} from '../controllers/pgController.js';
import OwnerProfile from '../models/OwnerProfile.js';
import { authenticateJWT, ownerAuth, addLocationFilter, optionalAuth } from '../middleware/auth.js';
import { logAction } from '../utils/auditLogService.js';

const router = express.Router();

// Public Routes with location filtering and optional authentication
// Get all PGs with filtering and pagination
router.get('/public', optionalAuth, addLocationFilter, getAllPGs);

// Get featured PGs
router.get('/public/featured', addLocationFilter, getFeaturedPGs);

// Search PGs
router.get('/public/search', addLocationFilter, searchPGs);

// Get PG by slug (SEO-friendly)
router.get('/public/slug/:slug', getPGBySlug);

// Get single PG by ID (public)
router.get('/public/:id', getPGById);

// Track inquiry
router.post('/public/:id/inquiry', trackInquiry);

// Owner Protected Routes
// Create PG with KYC validation
router.post('/', authenticateJWT, ownerAuth, async (req, res) => {
  try {
    // KYC approval check
    const ownerProfile = await OwnerProfile.findOne({ owner_id: req.user.id });
    if (!ownerProfile || ownerProfile.approval_status !== 'approved') {
      return res.status(403).json({ 
        success: false,
        error: 'KYC approval required. Please complete your profile.' 
      });
    }

    // Add owner ID and audit log
    req.body.owner = req.user._id;
    await createPG(req, res);
    
    // Audit log for successful creation
    if (res.statusCode === 201) {
      await logAction({
        action: 'PG Created',
        performedBy: req.user.id,
        targetType: 'PG',
        details: req.body
      });
    }
  } catch (err) {
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Get all PGs for owner with analytics
router.get('/owner/dashboard', authenticateJWT, ownerAuth, getOwnerPGs);

// Get single PG by ID (owner)
router.get('/:id', authenticateJWT, ownerAuth, async (req, res) => {
  try {
    await getPGById(req, res);
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Update PG
router.put('/:id', authenticateJWT, ownerAuth, async (req, res) => {
  try {
    await updatePG(req, res);
    
    // Audit log for update
    if (res.statusCode === 200) {
      await logAction({
        action: 'PG Updated',
        performedBy: req.user.id,
        targetId: req.params.id,
        targetType: 'PG',
        details: req.body
      });
    }
  } catch (err) {
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Soft delete PG
router.delete('/:id', authenticateJWT, ownerAuth, async (req, res) => {
  try {
    await deletePG(req, res);
    
    // Audit log for deletion
    if (res.statusCode === 200) {
      await logAction({
        action: 'PG Deleted',
        performedBy: req.user.id,
        targetId: req.params.id,
        targetType: 'PG'
      });
    }
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

export default router;
