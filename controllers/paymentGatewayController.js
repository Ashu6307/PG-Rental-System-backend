// paymentGatewayController.js
// Industry-level payment gateway integration controller
const Payment = require('../models/Payment');
const paymentGateway = require('../utils/paymentGateway');

// Initiate payment
exports.initiatePayment = async (req, res) => {
  try {
    const { userId, ownerId, pgId, amount, method, meta } = req.body;
    // Call payment gateway utility (e.g., Razorpay, Stripe, etc.)
    const result = await paymentGateway.initiate({ userId, ownerId, pgId, amount, method, meta });
    if (result.success) {
      const payment = await Payment.create({ user: userId, owner: ownerId, pg: pgId, amount, method, status: 'initiated', gatewayRef: result.ref, meta });
      res.json({ success: true, payment, gateway: result });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
};

// Payment callback/webhook
exports.paymentCallback = async (req, res) => {
  try {
    const { gatewayRef, status, meta } = req.body;
    const payment = await Payment.findOneAndUpdate({ gatewayRef }, { status, meta }, { new: true });
    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process payment callback' });
  }
};

// List payments (with filters)
exports.listPayments = async (req, res) => {
  try {
    const { user, owner, pg, status, dateFrom, dateTo } = req.query;
    const query = {};
    if (user) query.user = user;
    if (owner) query.owner = owner;
    if (pg) query.pg = pg;
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    const payments = await Payment.find(query).populate('user owner pg').sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};
