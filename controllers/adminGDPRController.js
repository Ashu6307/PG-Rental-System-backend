// adminGDPRController.js
// Industry-level GDPR/data consent controller for Admin Dashboard
const GDPRConsent = require('../models/GDPRConsent');

// List user consents (with filters)
exports.listConsents = async (req, res) => {
  try {
    const { user, status, dateFrom, dateTo } = req.query;
    const query = {};
    if (user) query.user = user;
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    const consents = await GDPRConsent.find(query).populate('user').sort({ createdAt: -1 });
    res.json({ consents });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch consents' });
  }
};

// Update consent status
exports.updateConsentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await GDPRConsent.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update consent status' });
  }
};

// Delete consent record
exports.deleteConsent = async (req, res) => {
  try {
    await GDPRConsent.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete consent record' });
  }
};
