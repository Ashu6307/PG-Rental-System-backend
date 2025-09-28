const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const auth = require('../middleware/auth');

// Get user audit logs
router.get('/my', auth, auditLogController.getUserAuditLogs);
// Soft delete audit log
router.delete('/:id', auth, auditLogController.deleteAuditLog);

module.exports = router;