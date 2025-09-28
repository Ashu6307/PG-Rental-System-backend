import express from 'express';
import { getOwnerGDPRConsent, updateOwnerGDPRConsent } from '../controllers/ownerGDPRConsentController.js';
import { ownerAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', ownerAuth, getOwnerGDPRConsent);
router.put('/', ownerAuth, updateOwnerGDPRConsent);

export default router;
