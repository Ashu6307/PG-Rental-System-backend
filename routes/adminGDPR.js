// adminGDPR.js
const express = require('express');
const router = express.Router();
const adminGDPRController = require('../controllers/adminGDPRController');

// List consents
router.get('/', adminGDPRController.listConsents);
// Update consent status
router.patch('/:id/status', adminGDPRController.updateConsentStatus);
// Delete consent record
router.delete('/:id', adminGDPRController.deleteConsent);

module.exports = router;
