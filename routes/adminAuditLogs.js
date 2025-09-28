// ...existing code...
const express = require('express');
const router = express.Router();
const adminAuditLogController = require('../controllers/adminAuditLogController');
const adminAuth = require('../middleware/adminAuth');

// List audit logs with filters
router.get('/', adminAuth, adminAuditLogController.listAuditLogs);
// Soft delete audit log
router.delete('/:id', adminAuth, adminAuditLogController.deleteAuditLog);

module.exports = router;
// ...existing code...
