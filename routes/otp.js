
import express from 'express';
import otpController from '../controllers/otpController.js';
import Settings from '../models/Settings.js';
import OtpAudit from '../models/OtpAudit.js';
import Consent from '../models/Consent.js';
const router = express.Router();

router.post('/send-otp', otpController.sendOtp);
router.post('/verify-otp', otpController.verifyOtp);
router.post('/resend-otp', otpController.resendOtp);
router.post('/check-email', otpController.checkEmailExists);

// Get current OTP settings
router.get('/settings', async (req, res) => {
  const settings = await Settings.findOne({ key: 'otp' });
  res.json(settings || {});
});

// Update OTP settings
router.put('/settings', async (req, res) => {
  const { length, expiry, retryLimit, webhookUrl, updatedBy } = req.body;
  let settings = await Settings.findOne({ key: 'otp' });
  if (!settings) settings = new Settings({ key: 'otp' });
  settings.length = length;
  settings.expiry = expiry;
  settings.retryLimit = retryLimit;
  settings.webhookUrl = webhookUrl;
  settings.updatedBy = updatedBy;
  settings.updatedAt = new Date();
  await settings.save();
  res.json({ success: true, settings });
});

// Get OTP audit logs (with filters)
router.get('/audit', async (req, res) => {
  const { email, action, status, tenantId, limit = 50 } = req.query;
  const query = {};
  if (email) query.email = email;
  if (action) query.action = action;
  if (status) query.status = status;
  if (tenantId) query.tenantId = tenantId;
  const logs = await OtpAudit.find(query).sort({ createdAt: -1 }).limit(Number(limit));
  res.json(logs);
});

// Get consent logs
router.get('/consent', async (req, res) => {
  const { email, tenantId, limit = 50 } = req.query;
  const query = {};
  if (email) query.email = email;
  if (tenantId) query.tenantId = tenantId;
  const logs = await Consent.find(query).sort({ createdAt: -1 }).limit(Number(limit));
  res.json(logs);
});

// Analytics summary
router.get('/analytics', async (req, res) => {
  const { tenantId } = req.query;
  const match = tenantId ? { tenantId } : {};
  const summary = await OtpAudit.aggregate([
    { $match: match },
    { $group: {
      _id: '$action',
      count: { $sum: 1 },
      success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
      error: { $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] } },
    }},
  ]);
  res.json(summary);
});

export default router;
