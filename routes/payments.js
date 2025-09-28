import { Router } from 'express';
import Payment from '../models/Payment.js';
import { authenticateJWT } from '../middleware/auth.js';
import { sendNotification } from '../utils/notificationService.js';
import { logAction } from '../utils/auditLogService.js';
import paymentGatewayController from '../controllers/paymentGatewayController.js';

const router = Router();
// Payment gateway integration endpoints
router.post('/initiate', paymentGatewayController.initiatePayment);
router.post('/callback', paymentGatewayController.paymentCallback);
router.get('/', paymentGatewayController.listPayments);

router.post('/', authenticateJWT, async (req, res) => {
  try {
    const payment = new Payment({ ...req.body, user_id: req.user.id });
    await payment.save();
    // Notification
    await sendNotification({
      userId: req.user.id,
      type: 'email',
      message: `Payment processed for booking ${req.body.booking_id}`,
      channel: 'system',
      meta: req.body
    });
    // Audit log
    await logAction({
      action: 'Payment Created',
      performedBy: req.user.id,
      targetId: payment._id,
      targetType: 'Payment',
      details: req.body
    });
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get user's payment history
router.get('/my', authenticateJWT, async (req, res) => {
  try {
    const payments = await Payment.find({ user_id: req.user.id, status: { $ne: 'deleted' } });
    res.status(200).json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soft delete payment
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    payment.status = 'deleted';
    await payment.save();
    res.json({ message: 'Payment soft deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Advanced payment search/filter endpoint
router.post('/search', async (req, res) => {
  const { filters, sort, page, limit } = req.body;
  try {
    // TODO: Implement advanced search/filter logic
    // Example: Use MongoDB aggregation for flexible search
    const payments = await Payment.aggregate([
      { $match: filters || {} },
      { $sort: sort || { createdAt: -1 } },
      { $skip: ((page || 1) - 1) * (limit || 20) },
      { $limit: limit || 20 },
    ]);
    res.status(200).json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;