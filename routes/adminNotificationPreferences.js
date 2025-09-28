// adminNotificationPreferences.js
const express = require('express');
const router = express.Router();
const adminNotificationPreferencesController = require('../controllers/adminNotificationPreferencesController');

// List notification preferences
router.get('/', adminNotificationPreferencesController.listPreferences);
// Update notification preference
router.patch('/:id', adminNotificationPreferencesController.updatePreference);
// Delete notification preference
router.delete('/:id', adminNotificationPreferencesController.deletePreference);

module.exports = router;
