const express = require('express');
const router = express.Router();
const notificationPreferenceController = require('../controllers/notificationPreferenceController');
const auth = require('../middleware/auth');

// Get user notification preferences
router.get('/my', auth, notificationPreferenceController.getUserPreferences);
// Update user notification preferences
router.post('/update', auth, notificationPreferenceController.updateUserPreferences);

module.exports = router;