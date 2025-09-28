import express from 'express';
const router = express.Router();
import flatController from '../controllers/flatController.js';

// Public routes
router.get('/public', flatController.getPublicFlats);
router.get('/featured', flatController.getFeaturedFlats);
router.get('/search', flatController.searchFlats);
router.get('/nearby', flatController.getNearbyFlats);
router.get('/filters', flatController.getFlatFilters);
router.get('/:id', flatController.getFlatDetails);

export default router;
