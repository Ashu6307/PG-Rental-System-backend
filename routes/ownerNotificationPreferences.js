
import express from 'express';
import { ownerAuth } from '../middleware/auth.js';
import ctrl from '../controllers/ownerNotificationPreferenceController.js';
const router = express.Router();

router.get('/', ownerAuth, ctrl.getPreferences);
router.put('/', ownerAuth, ctrl.updatePreferences);

export default router;
