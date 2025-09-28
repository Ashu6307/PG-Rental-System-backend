import express from 'express';
import { getOwnerProfile, updateOwnerProfile, uploadAvatar } from '../controllers/ownerProfileController.js';
import { authenticateJWT, ownerAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateJWT, ownerAuth, getOwnerProfile);
router.put('/', authenticateJWT, ownerAuth, updateOwnerProfile);
router.post('/avatar', authenticateJWT, ownerAuth, uploadAvatar);

export default router;
