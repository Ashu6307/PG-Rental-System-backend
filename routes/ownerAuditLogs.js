import express from 'express';
import { getOwnerAuditLogs } from '../controllers/ownerAuditLogController.js';
import { ownerAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', ownerAuth, getOwnerAuditLogs);

export default router;
