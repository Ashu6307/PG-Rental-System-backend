// paymentController.js
// Controller for user payment history

const Payment = require('../models/Payment');

exports.getUserPayments = async (req, res) => {
  try {
    const userId = req.user._id;
    const payments = await Payment.find({ user: userId, isDeleted: false }).populate('booking');
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addPayment = async (req, res) => {
  try {
    const { booking, amount, method, transactionId, status } = req.body;
    const userId = req.user._id;
    const payment = new Payment({
      user: userId,
      booking,
      amount,
      method,
      transactionId,
      status,
      paidAt: status === 'success' ? new Date() : null
    });
    await payment.save();
    res.status(201).json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    payment.isDeleted = true;
    await payment.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
