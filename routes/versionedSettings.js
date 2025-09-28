const express = require('express');
const router = express.Router();
const versionedSettingController = require('../controllers/versionedSettingController');
const auth = require('../middleware/auth');

// Get user versioned settings
router.get('/my', auth, versionedSettingController.getUserSettings);
// Add or update versioned setting
router.post('/addOrUpdate', auth, versionedSettingController.addOrUpdateSetting);
// Soft delete versioned setting
router.delete('/:id', auth, versionedSettingController.deleteSetting);

module.exports = router;