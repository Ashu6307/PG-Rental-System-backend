const express = require('express');
const router = express.Router();
const adminAssetController = require('../controllers/adminAssetController');
const adminAuth = require('../middleware/adminAuth');

// PG routes
router.get('/pgs', adminAuth, adminAssetController.listPGs);
router.post('/pgs/approve/:id', adminAuth, adminAssetController.approvePG);
router.post('/pgs/reject/:id', adminAuth, adminAssetController.rejectPG);

// Owner routes
router.get('/owners', adminAuth, adminAssetController.listOwners);
router.post('/owners/approve/:id', adminAuth, adminAssetController.approveOwner);
router.post('/owners/reject/:id', adminAuth, adminAssetController.rejectOwner);

module.exports = router;