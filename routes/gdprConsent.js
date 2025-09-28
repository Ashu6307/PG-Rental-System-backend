// gdprConsent.js
const express = require('express');
const router = express.Router();
const gdprConsentController = require('../controllers/gdprConsentController');
const auth = require('../middleware/auth');

// User records consent
router.post('/record', auth, gdprConsentController.recordConsent);
// User views their consents
router.get('/my', auth, gdprConsentController.listUserConsents);
// Admin views all consents
router.get('/all', gdprConsentController.listAllConsents);

module.exports = router;
