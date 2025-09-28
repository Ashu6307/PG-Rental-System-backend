// softDelete.js
import express from 'express';
import { softDelete, restore } from '../controllers/softDeleteController.js';

const router = express.Router();

// Soft delete any entity
router.post('/delete', softDelete);
// Restore soft deleted entity
router.post('/restore', restore);

export default router;
