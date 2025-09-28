import express from 'express';
import {
  uploadDocument,
  getOwnerDocuments,
  getDocumentById,
  deleteDocument
} from '../controllers/ownerDocumentController.js';
import { authenticateJWT, ownerAuth } from '../middleware/auth.js';

const router = express.Router();

// Owner document verification routes
router.post('/', authenticateJWT, ownerAuth, uploadDocument);
router.get('/', authenticateJWT, ownerAuth, getOwnerDocuments);
router.get('/:id', authenticateJWT, ownerAuth, getDocumentById);
router.delete('/:id', authenticateJWT, ownerAuth, deleteDocument);

export default router;
