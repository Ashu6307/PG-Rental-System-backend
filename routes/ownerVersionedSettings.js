
import express from 'express';
import { ownerAuth } from '../middleware/auth.js';
import ctrl from '../controllers/ownerVersionedSettingController.js';
const router = express.Router();

router.get('/', ownerAuth, ctrl.getSettings);
router.post('/', ownerAuth, ctrl.upsertSetting);
router.get('/:key/history', ownerAuth, ctrl.getSettingHistory);

export default router;
