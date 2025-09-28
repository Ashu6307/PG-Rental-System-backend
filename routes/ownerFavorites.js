import express from 'express';
import { getOwnerFavorites, toggleFavorite } from '../controllers/ownerFavoriteController.js';
import { authenticateJWT, ownerAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateJWT, ownerAuth, getOwnerFavorites);
router.post('/toggle', authenticateJWT, ownerAuth, toggleFavorite);

export default router;
