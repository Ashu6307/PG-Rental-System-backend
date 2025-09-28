import express from 'express';
import { getOwnerRevenue } from '../controllers/ownerRevenueController.js';
import { ownerAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', ownerAuth, getOwnerRevenue);

export default router;
