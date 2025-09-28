const express = require('express');
const router = express.Router();
const webhookLogController = require('../controllers/webhookLogController');
const auth = require('../middleware/auth');

// Get user webhook logs
router.get('/my', auth, webhookLogController.getUserWebhookLogs);
// Soft delete webhook log
router.delete('/:id', auth, webhookLogController.deleteWebhookLog);

module.exports = router;