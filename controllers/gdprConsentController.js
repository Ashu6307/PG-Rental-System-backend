// gdprConsentController.js
// Industry-level GDPR/data consent controller
const GDPRConsent = require('../models/GDPRConsent');

// Record user consent
exports.recordConsent = async (req, res) => {
  try {
    const { consentType, status, version } = req.body;
    const userId = req.user._id;
    const consent = await GDPRConsent.create({
      user: userId,
      consentType,
      status,
      version,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    res.json({ success: true, consent });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record consent' });
  }
};

// List user consents
exports.listUserConsents = async (req, res) => {
  try {
    const userId = req.user._id;
    const consents = await GDPRConsent.find({ user: userId }).sort({ timestamp: -1 });
    res.json({ success: true, consents });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch consents' });
  }
};

// Admin: List all consents
exports.listAllConsents = async (req, res) => {
  try {
    const consents = await GDPRConsent.find({}).populate('user').sort({ timestamp: -1 });
    res.json({ success: true, consents });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch all consents' });
  }
};
