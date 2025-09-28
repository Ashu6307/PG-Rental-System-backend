
import express from 'express';
import { ownerAuth } from '../middleware/auth.js';
import ctrl from '../controllers/ownerWebhookLogController.js';
const router = express.Router();

router.get('/', ownerAuth, ctrl.getLogs);
router.post('/', ownerAuth, ctrl.createLog);
router.put('/:id', ownerAuth, ctrl.updateLog);

export default router;
