// adminRateLimiting.js
const express = require('express');
const router = express.Router();
const adminRateLimitingController = require('../controllers/adminRateLimitingController');

// List rate limit logs
router.get('/', adminRateLimitingController.listRateLimitLogs);
// Delete rate limit log
router.delete('/:id', adminRateLimitingController.deleteRateLimitLog);

module.exports = router;
