const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { adminAuth } = require('../middleware/adminAuth');
const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Public: Get all active offers
router.get('/', offerController.getOffers);

// Admin: Create offer
router.post('/', adminAuth, offerController.createOffer);

// Admin: Update offer
router.put('/:id', adminAuth, offerController.updateOffer);

// Admin: Delete offer
router.delete('/:id', adminAuth, offerController.deleteOffer);

// Admin: Upload images to Cloudinary
router.post('/upload', adminAuth, upload.array('images', 10), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
    const urls = await Promise.all(
      files.map(file => new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'offers' }, (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }).end(file.buffer);
      }))
    );
    res.json({ urls });
  } catch (err) {
    res.status(500).json({ error: 'Image upload failed' });
  }
});

module.exports = router;
