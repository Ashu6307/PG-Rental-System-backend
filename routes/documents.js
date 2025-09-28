// Import necessary modules and initialize router
const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const documentController = require('../controllers/documentController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/documents/' });

// Advanced document search/filter endpoint
router.post('/search', async (req, res) => {
  const { filters, sort, page, limit } = req.body;
  try {
    // TODO: Implement advanced search/filter logic
    // Example: Use MongoDB aggregation for flexible search
    const documents = await Document.aggregate([
      { $match: filters || {} },
      { $sort: sort || { createdAt: -1 } },
      { $skip: ((page || 1) - 1) * (limit || 20) },
      { $limit: limit || 20 },
    ]);
    res.status(200).json({ success: true, documents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// User uploads document
router.post('/upload', auth, upload.single('file'), documentController.uploadDocument);
// User views own documents
router.get('/my', auth, documentController.getUserDocuments);
// Admin verifies document
router.post('/verify/:id', adminAuth, documentController.verifyDocument);
// User soft deletes document
router.delete('/:id', auth, documentController.deleteDocument);

// Export the router
module.exports = router;