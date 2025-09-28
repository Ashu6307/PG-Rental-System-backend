// adminSettings.js
const express = require('express');
const router = express.Router();
const adminSettingsController = require('../controllers/adminSettingsController');

// List settings
router.get('/', adminSettingsController.listSettings);
// Update setting (versioned)
router.post('/update', adminSettingsController.updateSetting);
// Delete setting
router.delete('/:id', adminSettingsController.deleteSetting);

module.exports = router;
