const express = require('express');
const router = express.Router();
const consentController = require('../controllers/consentController');
const auth = require('../middleware/auth');

// Get user consent status
router.get('/my', auth, consentController.getUserConsent);
// Accept consent
router.post('/accept', auth, consentController.acceptConsent);
// Revoke consent
router.post('/revoke', auth, consentController.revokeConsent);

module.exports = router;