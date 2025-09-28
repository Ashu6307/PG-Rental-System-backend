// ...existing code...
const express = require('express');
const router = express.Router();
const adminDocumentController = require('../controllers/adminDocumentController');
const adminAuth = require('../middleware/adminAuth');

// List documents with filters
router.get('/', adminAuth, adminDocumentController.listDocuments);
// Verify document
router.post('/verify/:id', adminAuth, adminDocumentController.verifyDocument);

module.exports = router;
// ...existing code...
