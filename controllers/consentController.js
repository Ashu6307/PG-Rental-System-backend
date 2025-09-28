// consentController.js
// Controller for user GDPR/data consent

const Consent = require('../models/Consent');

exports.getUserConsent = async (req, res) => {
  try {
    const userId = req.user._id;
    const consent = await Consent.findOne({ user: userId, isDeleted: false });
    res.json({ success: true, consent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.acceptConsent = async (req, res) => {
  try {
    const userId = req.user._id;
    let consent = await Consent.findOne({ user: userId, isDeleted: false });
    if (!consent) {
      consent = new Consent({ user: userId, accepted: true, acceptedAt: new Date() });
    } else {
      consent.accepted = true;
      consent.acceptedAt = new Date();
      consent.revoked = false;
      consent.revokedAt = null;
    }
    await consent.save();
    res.json({ success: true, consent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.revokeConsent = async (req, res) => {
  try {
    const userId = req.user._id;
    const consent = await Consent.findOne({ user: userId, isDeleted: false });
    if (!consent) return res.status(404).json({ success: false, message: 'Consent not found' });
    consent.revoked = true;
    consent.revokedAt = new Date();
    consent.accepted = false;
    await consent.save();
    res.json({ success: true, consent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
